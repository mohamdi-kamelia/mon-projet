package ws

import (
	"log"
	"mam-server/models"
	"net/http"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow connections from any origin (adjust for production)
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// signature unchanged; 'world' is chosen in main.go and implements WorldInterface
func HandleWebSocket(w http.ResponseWriter, r *http.Request, world WorldInterface, lookup WorldLookup) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil { /* ... */
		return
	}

	var player models.Player
	if err := conn.ReadJSON(&player); err != nil { /* ... */
		return
	}
	if player.ID == "" { /* ... */
		return
	}

	client := NewClient(player.ID, conn, &player)
	client.SetWorld(world)
	client.SetWorldLookup(lookup) // <-- add this

	// join current world
	joinMsg := &models.WorldMessage{
		Type:     models.PlayerJoin,
		PlayerID: player.ID,
		Data:     client,
	}
	world.SendMessage(joinMsg)

	client.StartGoroutines()
	log.Printf("✅ Player %s connected to world %s", player.ID, world.GetID())
}
