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
	ID      string // SQL ID (ex: "1")
	UnityID string // Unity ID (ex: "86411acc") - mis à jour au premier proximity_connect
	Conn    *websocket.Conn
	mu      sync.Mutex
}

var (
	clients   = make(map[string]*Client) // clé = SQL ID
	unityMap  = make(map[string]string)  // Unity ID → SQL ID
	clientsMu sync.RWMutex
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
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
	// Supprime aussi le mapping Unity ID
	if c, ok := clients[playerID]; ok && c.UnityID != "" {
		delete(unityMap, c.UnityID)
	}
	delete(clients, playerID)
	log.Printf("❌ Client déconnecté: %s (total: %d)", playerID, len(clients))
}

// Résout un ID : accepte SQL ID ou Unity ID
func resolveID(id string) string {
	clientsMu.RLock()
	defer clientsMu.RUnlock()
	// Si c'est un SQL ID connu → retourne tel quel
	if _, ok := clients[id]; ok {
		return id
	}
	// Sinon cherche dans le mapping Unity ID → SQL ID
	if sqlID, ok := unityMap[id]; ok {
		return sqlID
	}
	return id // inconnu, retourne tel quel
}

func sendToPlayer(playerID string, msg WSMessage) {
	resolvedID := resolveID(playerID)

	clientsMu.RLock()
	client, exists := clients[resolvedID]
	clientsMu.RUnlock()

	if !exists {
		log.Printf("⚠️  Joueur introuvable: %s (résolu: %s)", playerID, resolvedID)
		return
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	if err := client.Conn.WriteJSON(msg); err != nil {
		log.Printf("❌ Erreur envoi message à %s: %v", playerID, err)
	}
}

// Enregistre le lien SQL ID ↔ Unity ID
func registerUnityID(sqlID string, unityID string) {
	if unityID == "" {
		return
	}
	clientsMu.Lock()
	defer clientsMu.Unlock()
	if c, ok := clients[sqlID]; ok {
		c.UnityID = unityID
		unityMap[unityID] = sqlID
		log.Printf("🔗 Mapping Unity ID: %s ↔ SQL ID: %s", unityID, sqlID)
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

			// Si l'ID Unity est fourni dès le join, on l'enregistre
			if msg.UnityID != "" {
				registerUnityID(playerID, msg.UnityID)
			}

			conn.WriteJSON(WSMessage{
				Type:     "joined",
				PlayerID: playerID,
			})

		case "register_unity_id":
			// Message optionnel pour enregistrer l'ID Unity séparément
			if playerID != "" && msg.UnityID != "" {
				registerUnityID(playerID, msg.UnityID)
			}

		case "proximity_connect":
			if playerID == "" {
				continue
			}

			targetID := msg.TargetPlayerID
			log.Printf("🟢 Proximité connect: %s → %s (%.1fm)", playerID, targetID, msg.Distance)

			// Résout l'ID cible (Unity ou SQL)
			resolvedTarget := resolveID(targetID)

			// Notifie le joueur local
			sendToPlayer(playerID, WSMessage{
				Type: "webrtc_connect",
				Data: marshalData(map[string]interface{}{
					"targetPlayerID": resolvedTarget,
					"distance":       msg.Distance,
					"action":         "connect",
				}),
			})

			// Notifie le joueur distant
			sendToPlayer(resolvedTarget, WSMessage{
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
			resolvedTarget := resolveID(targetID)
			log.Printf("🔴 Proximité disconnect: %s → %s", playerID, resolvedTarget)

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

		case "webrtc_offer", "webrtc_answer", "webrtc_ice":
			if msg.ToPlayer == "" {
				log.Printf("⚠️  Message %s sans toPlayer", msg.Type)
				continue
			}

			resolvedTo := resolveID(msg.ToPlayer)
			log.Printf("📨 Relai %s: %s → %s (résolu: %s)", msg.Type, playerID, msg.ToPlayer, resolvedTo)

			sendToPlayer(resolvedTo, WSMessage{
				Type:       msg.Type,
				FromPlayer: playerID,
				ToPlayer:   resolvedTo,
				Data:       msg.Data,
			})

		case "player_update":
			// Ignoré, Unity gère la proximité

		default:
			log.Printf("⚠️  Message inconnu: %s", msg.Type)
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
