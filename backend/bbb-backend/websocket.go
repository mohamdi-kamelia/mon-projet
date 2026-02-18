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
	UnityID        string          `json:"unityId,omitempty"`
	FromPlayer     string          `json:"fromPlayer,omitempty"`
	ToPlayer       string          `json:"toPlayer,omitempty"`
	TargetPlayerID string          `json:"targetPlayerId,omitempty"`
	Distance       float64         `json:"distance,omitempty"`
	Data           json.RawMessage `json:"data,omitempty"`
}

type Client struct {
	ID      string
	UnityID string
	Conn    *websocket.Conn
	mu      sync.Mutex
}

type pendingEntry struct {
	senderSQLID   string
	targetUnityID string
	distance      float64
}

type pendingMessage struct {
	msgType    string
	fromPlayer string
	toUnityID  string
	data       json.RawMessage
}

var (
	clients          = make(map[string]*Client)
	unityMap         = make(map[string]string)
	clientsMu        sync.RWMutex
	pendingProximity []pendingEntry
	pendingMessages  []pendingMessage
	pendingMu        sync.Mutex
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func addClient(client *Client) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	clients[client.ID] = client
	log.Printf("Client connecté: %s (total: %d)", client.ID, len(clients))
}

func removeClient(playerID string) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	if c, ok := clients[playerID]; ok && c.UnityID != "" {
		delete(unityMap, c.UnityID)
	}
	delete(clients, playerID)
	log.Printf("Client déconnecté: %s (total: %d)", playerID, len(clients))
}

func resolveID(id string) string {
	clientsMu.RLock()
	defer clientsMu.RUnlock()
	if _, ok := clients[id]; ok {
		return id
	}
	if sqlID, ok := unityMap[id]; ok {
		return sqlID
	}
	return id
}

func isReachable(id string) bool {
	resolved := resolveID(id)
	clientsMu.RLock()
	defer clientsMu.RUnlock()
	_, ok := clients[resolved]
	return ok
}

func sendToPlayer(playerID string, msg WSMessage) {
	resolvedID := resolveID(playerID)
	clientsMu.RLock()
	client, exists := clients[resolvedID]
	clientsMu.RUnlock()

	if !exists {
		log.Printf("Joueur introuvable: %s (résolu: %s)", playerID, resolvedID)
		return
	}
	client.mu.Lock()
	defer client.mu.Unlock()
	if err := client.Conn.WriteJSON(msg); err != nil {
		log.Printf("Erreur envoi à %s: %v", playerID, err)
	}
}

func broadcastToAll(senderID string, msg WSMessage) {
	clientsMu.RLock()
	defer clientsMu.RUnlock()
	for id, client := range clients {
		if id == senderID {
			continue
		}
		client.mu.Lock()
		client.Conn.WriteJSON(msg)
		client.mu.Unlock()
	}
}

func registerUnityID(sqlID string, unityID string) {
	if unityID == "" {
		return
	}
	clientsMu.Lock()
	defer clientsMu.Unlock()
	if c, ok := clients[sqlID]; ok {
		if c.UnityID == unityID {
			return
		}
		c.UnityID = unityID
		unityMap[unityID] = sqlID
		log.Printf("Mapping Unity ID: %s <-> SQL ID: %s", unityID, sqlID)
	}
}

func tryResolvePendingProximity() {
	pendingMu.Lock()
	defer pendingMu.Unlock()

	if len(pendingProximity) < 2 {
		return
	}

	for i := 0; i < len(pendingProximity); i++ {
		for j := i + 1; j < len(pendingProximity); j++ {
			a := pendingProximity[i]
			b := pendingProximity[j]

			if a.senderSQLID == b.senderSQLID {
				continue
			}

			registerUnityID(b.senderSQLID, a.targetUnityID)
			registerUnityID(a.senderSQLID, b.targetUnityID)

			pendingProximity = append(pendingProximity[:j], pendingProximity[j+1:]...)
			pendingProximity = append(pendingProximity[:i], pendingProximity[i+1:]...)

			toReplay := make([]pendingMessage, len(pendingMessages))
			copy(toReplay, pendingMessages)
			pendingMessages = nil

			aEntry := a
			bEntry := b
			go func() {
				deduped := []pendingMessage{}
				seen := map[string]bool{}
				for k := len(toReplay) - 1; k >= 0; k-- {
					pm := toReplay[k]
					key := pm.msgType + "|" + pm.toUnityID
					if pm.msgType == "webrtc_offer" || pm.msgType == "webrtc_answer" {
						if seen[key] {
							continue
						}
						seen[key] = true
					}
					deduped = append([]pendingMessage{pm}, deduped...)
				}

				for _, pm := range deduped {
					resolvedTo := resolveID(pm.toUnityID)
					sendToPlayer(resolvedTo, WSMessage{
						Type:       pm.msgType,
						FromPlayer: pm.fromPlayer,
						ToPlayer:   resolvedTo,
						Data:       pm.data,
					})
				}
			}()

			go func() {
				resolvedB := resolveID(aEntry.targetUnityID)
				resolvedA := resolveID(bEntry.targetUnityID)

				sendToPlayer(aEntry.senderSQLID, WSMessage{
					Type: "webrtc_connect",
					Data: marshalData(map[string]interface{}{
						"targetPlayerID": resolvedB,
						"distance":       aEntry.distance,
						"action":         "connect",
					}),
				})
				sendToPlayer(bEntry.senderSQLID, WSMessage{
					Type: "webrtc_connect",
					Data: marshalData(map[string]interface{}{
						"targetPlayerID": resolvedA,
						"distance":       bEntry.distance,
						"action":         "connect",
					}),
				})
			}()

			return
		}
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Erreur upgrade WebSocket: %v", err)
		return
	}
	defer conn.Close()

	var playerID string

	for {
		var msg WSMessage
		if err := conn.ReadJSON(&msg); err != nil {
			log.Printf("Erreur lecture WebSocket: %v", err)
			break
		}

		switch msg.Type {

		case "join":
			playerID = msg.PlayerID
			if playerID == "" {
				continue
			}
			client := &Client{ID: playerID, Conn: conn}
			addClient(client)
			if msg.UnityID != "" {
				registerUnityID(playerID, msg.UnityID)
			}
			conn.WriteJSON(WSMessage{Type: "joined", PlayerID: playerID})

		case "register_unity_id":
			if playerID != "" && msg.UnityID != "" {
				registerUnityID(playerID, msg.UnityID)
			}

		case "proximity_connect":
			if playerID == "" {
				continue
			}
			targetID := msg.TargetPlayerID
			resolvedTarget := resolveID(targetID)

			if resolvedTarget == targetID {
				pendingMu.Lock()
				alreadyPending := false
				for _, p := range pendingProximity {
					if p.senderSQLID == playerID {
						alreadyPending = true
						break
					}
				}
				if !alreadyPending {
					pendingProximity = append(pendingProximity, pendingEntry{
						senderSQLID:   playerID,
						targetUnityID: targetID,
						distance:      msg.Distance,
					})
				}
				pendingMu.Unlock()
				tryResolvePendingProximity()
			} else {
				sendToPlayer(playerID, WSMessage{
					Type: "webrtc_connect",
					Data: marshalData(map[string]interface{}{
						"targetPlayerID": resolvedTarget,
						"distance":       msg.Distance,
						"action":         "connect",
					}),
				})
				sendToPlayer(resolvedTarget, WSMessage{
					Type: "webrtc_connect",
					Data: marshalData(map[string]interface{}{
						"targetPlayerID": playerID,
						"distance":       msg.Distance,
						"action":         "connect",
					}),
				})
			}

		case "proximity_disconnect":
			if playerID == "" {
				continue
			}
			targetID := msg.TargetPlayerID
			resolvedTarget := resolveID(targetID)

			pendingMu.Lock()
			for i := len(pendingProximity) - 1; i >= 0; i-- {
				if pendingProximity[i].senderSQLID == playerID {
					pendingProximity = append(pendingProximity[:i], pendingProximity[i+1:]...)
				}
			}
			pendingMu.Unlock()

			sendToPlayer(playerID, WSMessage{
				Type: "webrtc_disconnect",
				Data: marshalData(map[string]interface{}{
					"targetPlayerID": resolvedTarget,
					"action":         "disconnect",
				}),
			})
			sendToPlayer(resolvedTarget, WSMessage{
				Type: "webrtc_disconnect",
				Data: marshalData(map[string]interface{}{
					"targetPlayerID": playerID,
					"action":         "disconnect",
				}),
			})

		// ✅ Nouveau : relaye l'état mic/cam à tous les autres clients
		case "webrtc_media_state":
			if playerID == "" {
				continue
			}
			log.Printf("Media state de %s: %s", playerID, string(msg.Data))
			broadcastToAll(playerID, WSMessage{
				Type:       "webrtc_media_state",
				FromPlayer: playerID,
				Data:       msg.Data,
			})

		case "webrtc_offer", "webrtc_answer", "webrtc_ice":
			if msg.ToPlayer == "" {
				continue
			}

			resolvedTo := resolveID(msg.ToPlayer)

			if !isReachable(msg.ToPlayer) {
				pendingMu.Lock()
				if msg.Type == "webrtc_offer" || msg.Type == "webrtc_answer" {
					for i := len(pendingMessages) - 1; i >= 0; i-- {
						if pendingMessages[i].msgType == msg.Type && pendingMessages[i].toUnityID == msg.ToPlayer {
							pendingMessages = append(pendingMessages[:i], pendingMessages[i+1:]...)
						}
					}
				}
				pendingMessages = append(pendingMessages, pendingMessage{
					msgType:    msg.Type,
					fromPlayer: playerID,
					toUnityID:  msg.ToPlayer,
					data:       msg.Data,
				})
				pendingMu.Unlock()
			} else {
				sendToPlayer(resolvedTo, WSMessage{
					Type:       msg.Type,
					FromPlayer: playerID,
					ToPlayer:   resolvedTo,
					Data:       msg.Data,
				})
			}

		case "player_update":
		default:
			log.Printf("Message inconnu: %s", msg.Type)
		}
	}

	if playerID != "" {
		removeClient(playerID)
	}
}

func marshalData(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
