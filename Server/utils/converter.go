package utils

import "encoding/json"

// MapToStruct converts a map[string]interface{} to a struct
// This is useful for converting JSON messages to typed structs
func MapToStruct(m map[string]interface{}, out interface{}) error {
	bytes, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return json.Unmarshal(bytes, out)
}