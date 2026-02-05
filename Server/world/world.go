package world

import (
	"context"
	"encoding/json"
	"log"
	"mam-server/models"
	"mam-server/ws"
	"time"
)

// World represents a game scene/room running in its own goroutine
type World struct {
	ID       string
	Messages chan *models.WorldMessage

	Players map[string]*models.Player
	Clients map[string]*ws.Client
	Chairs  map[string]string // ChairUID -> PlayerID

	ctx    context.Context
	cancel context.CancelFunc
}

func NewWorld(id string) *World {
	ctx, cancel := context.WithCancel(context.Background())
	return &World{
		ID:       id,
		Messages: make(chan *models.WorldMessage, 100),
		Players:  make(map[string]*models.Player),
		Clients:  make(map[string]*ws.Client),
		Chairs:   make(map[string]string),
		ctx:      ctx,
		cancel:   cancel,
	}
}

func (w *World) SendMessage(msg *models.WorldMessage) {
	select {
	case w.Messages <- msg:
	case <-time.After(1 * time.Second):
		log.Printf("⚠️ Timeout sending message to world %s", w.ID)
	}
}

func (w *World) GetID() string {
	return w.ID
}

func (w *World) Run() {
	log.Printf("🌍 World %s started", w.ID)
	for {
		select {
		case <-w.ctx.Done():
			log.Printf("🌍 World %s stopped", w.ID)
			return
		case msg := <-w.Messages:
			w.handleMessage(msg)
		}
	}
}

func (w *World) handleMessage(msg *models.WorldMessage) {
	switch msg.Type {
	case models.PlayerJoin:
		w.handlePlayerJoin(msg)
	case models.PlayerLeave:
		w.handlePlayerLeave(msg)
	case models.PlayerUpdate:
		w.handlePlayerUpdate(msg)
	case models.ChairOccupancy:
		w.handleChairOccupancy(msg)
	default:
		log.Printf("⚠️ Unknown message type: %v", msg.Type)
	}
}

func (w *World) handlePlayerJoin(msg *models.WorldMessage) {
	client := msg.Data.(*ws.Client)
	player := client.Player

	w.Players[player.ID] = player
	w.Clients[player.ID] = client

	w.sendExistingPlayers(client)
	w.sendChairStates(client) // Send all chair states
	w.broadcastToOthers(player, player.ID)

	log.Printf("✅ Player %s joined world %s", player.ID, w.ID)
}

func (w *World) handlePlayerLeave(msg *models.WorldMessage) {
	playerID := msg.PlayerID

	// Free any chairs this player was occupying
	for chairUID, occupantID := range w.Chairs {
		if occupantID == playerID {
			w.Chairs[chairUID] = ""
			w.broadcastChairState(chairUID, "", false)
			log.Printf("🪑 Freed chair %s (player %s left)", chairUID, playerID)
		}
	}

	delete(w.Players, playerID)
	delete(w.Clients, playerID)

	disconnectMsg := map[string]interface{}{
		"type": "disconnect",
		"id":   playerID,
	}
	w.broadcastToAll(disconnectMsg)

	log.Printf("❌ Player %s left world %s (%d players remaining)",
		playerID, w.ID, len(w.Players))
}

func (w *World) handlePlayerUpdate(msg *models.WorldMessage) {
	player := msg.Data.(*models.Player)
	w.Players[player.ID] = player
	w.broadcastToOthers(player, player.ID)
}

func (w *World) handleChairOccupancy(msg *models.WorldMessage) {
	chairState := msg.Data.(*models.ChairState)

	if chairState.IsOccupied {
		w.Chairs[chairState.ChairUID] = chairState.PlayerID
	} else {
		w.Chairs[chairState.ChairUID] = ""
	}

	w.broadcastChairState(chairState.ChairUID, chairState.PlayerID, chairState.IsOccupied)
	log.Printf("🪑 Chair %s: %v (player: %s)", chairState.ChairUID, chairState.IsOccupied, chairState.PlayerID)
}

func (w *World) sendExistingPlayers(newClient *ws.Client) {
	count := 0
	for playerID, player := range w.Players {
		if playerID != newClient.ID {
			w.sendToClient(newClient, player)
			count++
		}
	}
	if count > 0 {
		log.Printf("📤 Sent %d existing players to %s", count, newClient.ID)
	}
}

func (w *World) sendChairStates(client *ws.Client) {
	for chairUID, playerID := range w.Chairs {
		if playerID != "" {
			state := &models.ChairState{
				ChairUID:   chairUID,
				PlayerID:   playerID,
				IsOccupied: true,
			}
			w.sendToClient(client, state)
		}
	}
}

func (w *World) broadcastChairState(chairUID, playerID string, occupied bool) {
	state := &models.ChairState{
		ChairUID:   chairUID,
		PlayerID:   playerID,
		IsOccupied: occupied,
	}
	w.broadcastToAll(state)
}

func (w *World) broadcastToAll(data interface{}) {
	for _, client := range w.Clients {
		w.sendToClient(client, data)
	}
}

func (w *World) broadcastToOthers(data interface{}, excludePlayerID string) {
	for playerID, client := range w.Clients {
		if playerID != excludePlayerID {
			w.sendToClient(client, data)
		}
	}
}

func (w *World) sendToClient(client *ws.Client, data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("⚠️ Error marshaling data for client %s: %v", client.ID, err)
		return
	}

	select {
	case client.Send <- jsonData:
	default:
		log.Printf("⚠️ Client %s send channel full, removing", client.ID)
		delete(w.Clients, client.ID)
		delete(w.Players, client.ID)
		close(client.Send)
	}
}

func (w *World) Shutdown() {
	w.cancel()
}
