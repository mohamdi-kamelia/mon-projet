package models

// MessageType defines the types of operations that can be performed in a world
type MessageType string

const (
	PlayerJoin     MessageType = "player_join"
	PlayerLeave    MessageType = "player_leave"
	PlayerUpdate   MessageType = "player_update"
	ChairOccupancy MessageType = "chair_occupancy"
)

// WorldMessage is the envelope for all communication with world goroutines
type WorldMessage struct {
	Type     MessageType `json:"type"`
	PlayerID string      `json:"playerId"`
	Data     interface{} `json:"data"`
}

// ChairState represents a chair's occupancy state
type ChairState struct {
	ChairUID   string `json:"chairUID"`
	PlayerID   string `json:"playerID"` // empty if free
	IsOccupied bool   `json:"isOccupied"`
}