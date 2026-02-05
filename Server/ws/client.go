package ws

import (
	"encoding/json"
	"log"
	"mam-server/models"
	"mam-server/utils"
	"time"

	"github.com/gorilla/websocket"
)

type WorldInterface interface {
	SendMessage(msg *models.WorldMessage)
	GetID() string
}

type WorldLookup interface {
	GetOrCreate(id string) WorldInterface
}

type Client struct {
	ID          string
	Conn        *websocket.Conn
	Send        chan []byte
	Player      *models.Player
	World       WorldInterface
	WorldFinder WorldLookup
}

func NewClient(id string, conn *websocket.Conn, player *models.Player) *Client {
	return &Client{
		ID:     id,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Player: player,
	}
}

func (c *Client) SetWorld(world WorldInterface) {
	c.World = world
}

func (c *Client) SetWorldLookup(lu WorldLookup) { c.WorldFinder = lu }

func (c *Client) StartGoroutines() {
	go c.writePump()
	go c.readPump()
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("❌ Write error for client %s: %v", c.ID, err)
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("❌ Ping error for client %s: %v", c.ID, err)
				return
			}
		}
	}
}

func (c *Client) readPump() {
	defer func() {
		if c.World != nil {
			msg := &models.WorldMessage{
				Type:     models.PlayerLeave,
				PlayerID: c.ID,
				Data:     nil,
			}
			c.World.SendMessage(msg)
		}
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(4096)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var raw map[string]interface{}
		if err := c.Conn.ReadJSON(&raw); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("❌ Unexpected close error for client %s: %v", c.ID, err)
			} else {
				log.Printf("📱 Client %s disconnected normally", c.ID)
			}
			break
		}
		c.handleMessage(raw)
	}
}

func (c *Client) handleMessage(raw map[string]interface{}) {
	// 1) World change request
	if t, ok := raw["type"].(string); ok && t == "change_world" {
		target, _ := raw["target"].(string)
		if target == "" || c.WorldFinder == nil {
			log.Printf("⚠️ change_world missing target or lookup for client %s", c.ID)
			return
		}

		if p, ok := raw["position"].(map[string]interface{}); ok {
			_ = utils.MapToStruct(p, &c.Player.Position)
		}
		if r, ok := raw["rotation"].(map[string]interface{}); ok {
			_ = utils.MapToStruct(r, &c.Player.Rotation)
		}
		if s, ok := raw["skin"].(string); ok {
			c.Player.Skin = s
		}
		if a, ok := raw["animationState"].(float64); ok {
			c.Player.AnimationState = uint8(a)
		}

		if c.World != nil {
			leave := &models.WorldMessage{Type: models.PlayerLeave, PlayerID: c.ID}
			c.World.SendMessage(leave)
		}

		newWorld := c.WorldFinder.GetOrCreate(target)
		c.SetWorld(newWorld)

		join := &models.WorldMessage{
			Type:     models.PlayerJoin,
			PlayerID: c.ID,
			Data:     c,
		}
		newWorld.SendMessage(join)

		ack := map[string]interface{}{"type": "world_change", "world": target, "status": "ok"}
		if b, err := json.Marshal(ack); err == nil {
			select {
			case c.Send <- b:
			default:
			}
		}

		log.Printf("🚪 Client %s moved to world %s", c.ID, target)
		return
	}

	// 2) Chair occupancy update
	if t, ok := raw["type"].(string); ok && t == "chair_sit" {
		chairUID, _ := raw["chairUID"].(string)
		isOccupied, _ := raw["isOccupied"].(bool)

		if chairUID != "" && c.World != nil {
			chairState := &models.ChairState{
				ChairUID:   chairUID,
				PlayerID:   c.ID,
				IsOccupied: isOccupied,
			}
			msg := &models.WorldMessage{
				Type:     models.ChairOccupancy,
				PlayerID: c.ID,
				Data:     chairState,
			}
			c.World.SendMessage(msg)
		}
		return
	}

	// 3) Player position/rotation update
	if raw["id"] == c.ID && raw["position"] != nil {
		var player models.Player
		if err := utils.MapToStruct(raw, &player); err != nil {
			log.Printf("❌ Error parsing player update from %s: %v", c.ID, err)
			return
		}
		c.Player = &player
		if c.World != nil {
			msg := &models.WorldMessage{
				Type:     models.PlayerUpdate,
				PlayerID: c.ID,
				Data:     &player,
			}
			c.World.SendMessage(msg)
		}
		return
	}

	log.Printf("📝 Unknown message from client %s: %v", c.ID, raw)
}

func (c *Client) Close() {
	close(c.Send)
}
