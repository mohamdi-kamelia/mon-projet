package models

import (
	mathTypes "mam-server/math"
)

type Player struct {
	ID             string               `json:"id"`
	Position       mathTypes.Vector3    `json:"position"`
	Rotation       mathTypes.Quaternion `json:"rotation"`
	AnimationState uint8                `json:"animationState"`
	Skin           string               `json:"skin"`
}
