package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type WSMessage struct {
	Type           string          `json:"type"`
	PlayerID       string          `json:"playerId,omitempty"`
	FromPlayer     string          `json:"fromPlayer,omitempty"`
	ToPlayer       string          `json:"toPlayer,omitempty"`
	TargetPlayerID string          `json:"targetPlayerId,omitempty"`
	Distance       float64         `json:"distance,omitempty"`
	Data           json.RawMessage `json:"data,omitempty"`
}

type Client struct {
	ID   string
	Conn *websocket.Conn
	mu   sync.Mutex
}

var (
	clients   = make(map[string]*Client)
	clientsMu sync.RWMutex
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Accepte toutes les origines
	},
}

func addClient(client *Client) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	clients[client.ID] = client
	log.Printf("✅ Client connecté: %s (total: %d)", client.ID, len(clients))
}

func removeClient(playerID string) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	delete(clients, playerID)
	log.Printf("❌ Client déconnecté: %s (total: %d)", playerID, len(clients))
}

func sendToPlayer(playerID string, msg WSMessage) {
	clientsMu.RLock()
	client, exists := clients[playerID]
	clientsMu.RUnlock()

	if !exists {
		log.Printf("⚠️  Joueur introuvable: %s", playerID)
		return
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	if err := client.Conn.WriteJSON(msg); err != nil {
		log.Printf("❌ Erreur envoi message à %s: %v", playerID, err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ Erreur upgrade WebSocket: %v", err)
		return
	}
	defer conn.Close()

	var playerID string

	for {
		var msg WSMessage
		if err := conn.ReadJSON(&msg); err != nil {
			log.Printf("❌ Erreur lecture WebSocket: %v", err)
			break
		}

		switch msg.Type {

		case "join":
			playerID = msg.PlayerID
			if playerID == "" {
				log.Println("⚠️  Message join sans playerID")
				continue
			}

			client := &Client{
				ID:   playerID,
				Conn: conn,
			}
			addClient(client)

			// Confirme la connexion au joueur
			conn.WriteJSON(WSMessage{
				Type:     "joined",
				PlayerID: playerID,
			})

		case "proximity_connect":
			if playerID == "" {
				continue
			}

			targetID := msg.TargetPlayerID
			log.Printf("🟢 Proximité connect: %s → %s (%.1fm)", playerID, targetID, msg.Distance)

			// Notifie le joueur local
			sendToPlayer(playerID, WSMessage{
				Type: "webrtc_connect",
				Data: marshalData(map[string]interface{}{
					"targetPlayerID": targetID,
					"distance":       msg.Distance,
					"action":         "connect",
				}),
			})

			// Notifie le joueur distant
			sendToPlayer(targetID, WSMessage{
				Type: "webrtc_connect",
				Data: marshalData(map[string]interface{}{
					"targetPlayerID": playerID,
					"distance":       msg.Distance,
					"action":         "connect",
				}),
			})

		case "proximity_disconnect":
			if playerID == "" {
				continue
			}

			targetID := msg.TargetPlayerID
			log.Printf("🔴 Proximité disconnect: %s → %s", playerID, targetID)

			// Notifie le joueur local
			sendToPlayer(playerID, WSMessage{
				Type: "webrtc_disconnect",
				Data: marshalData(map[string]interface{}{
					"targetPlayerID": targetID,
					"action":         "disconnect",
				}),
			})

			// Notifie le joueur distant
			sendToPlayer(targetID, WSMessage{
				Type: "webrtc_disconnect",
				Data: marshalData(map[string]interface{}{
					"targetPlayerID": playerID,
					"action":         "disconnect",
				}),
			})

		case "webrtc_offer", "webrtc_answer", "webrtc_ice":
			if msg.ToPlayer == "" {
				log.Printf("⚠️  Message %s sans toPlayer", msg.Type)
				continue
			}

			log.Printf("📨 Relai %s: %s → %s", msg.Type, playerID, msg.ToPlayer)

			// Ajoute le fromPlayer et relaie
			sendToPlayer(msg.ToPlayer, WSMessage{
				Type:       msg.Type,
				FromPlayer: playerID,
				ToPlayer:   msg.ToPlayer,
				Data:       msg.Data,
			})

		case "player_update":
			// Rien à faire, Unity gère la proximité
			// On ignore juste ce message

		default:
			log.Printf("⚠️  Message inconnu: %s", msg.Type)
		}
	}

	// Nettoyage quand le joueur se déconnecte
	if playerID != "" {
		removeClient(playerID)
	}
}

// Helper pour marshaler les données
func marshalData(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
