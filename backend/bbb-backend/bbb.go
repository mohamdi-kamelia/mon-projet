package main

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

// BBB types
type JoinRequest struct {
	MeetingID   string `json:"meetingID"`
	UserName    string `json:"userName"`
	IsModerator bool   `json:"isModerator"`
}

type JoinResponse struct {
	Success bool   `json:"success"`
	URL     string `json:"url,omitempty"`
	Error   string `json:"error,omitempty"`
}

var (
	bbbURL    string
	bbbSecret string
)

func initBBB() {
	bbbURL = os.Getenv("BBB_URL")
	bbbSecret = os.Getenv("BBB_SECRET")

	if bbbURL == "" || bbbSecret == "" {
		log.Println("⚠️  BBB_URL and BBB_SECRET not set, BBB features disabled")
		return
	}

	bbbURL = strings.TrimSuffix(bbbURL, "/bigbluebutton")
	bbbURL = strings.TrimSuffix(bbbURL, "/")

	log.Printf("🔗 BBB URL: %s", bbbURL)
	log.Printf("🔗 BBB URLs will use: %s/bigbluebutton/api/...", bbbURL)
	log.Printf("🔑 BBB Secret configured: %s", maskSecret(bbbSecret))
}

func maskSecret(secret string) string {
	if len(secret) <= 4 {
		return "****"
	}
	return secret[:4] + "****"
}

func bbbRespondError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(JoinResponse{
		Success: false,
		Error:   message,
	})
}

func handleJoinMeeting(w http.ResponseWriter, r *http.Request) {
	var req JoinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		bbbRespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.MeetingID == "" || req.UserName == "" {
		bbbRespondError(w, "meetingID and userName are required", http.StatusBadRequest)
		return
	}

	log.Printf("📞 Demande de connexion: MeetingID=%s, User=%s, Moderator=%v", req.MeetingID, req.UserName, req.IsModerator)

	meetingExists, err := checkMeetingExists(req.MeetingID)
	if err != nil {
		log.Printf("⚠️ Erreur lors de la vérification: %v (on continue quand même)", err)
	}

	if !meetingExists {
		log.Printf("📋 Réunion %s n'existe pas → Création en cours", req.MeetingID)

		createURL, err := createMeeting(req.MeetingID)
		if err != nil {
			log.Printf("❌ Erreur création réunion: %v", err)
			bbbRespondError(w, "Failed to create meeting", http.StatusInternalServerError)
			return
		}

		log.Printf("🔗 Create meeting URL: %s", createURL)

		createResp, err := http.Get(createURL)
		if err != nil {
			log.Printf("❌ Erreur lors de l'appel create: %v", err)
			bbbRespondError(w, "Failed to create meeting", http.StatusInternalServerError)
			return
		}
		defer createResp.Body.Close()

		body, _ := io.ReadAll(createResp.Body)
		log.Printf("📋 BBB create response status: %d", createResp.StatusCode)
		log.Printf("📋 BBB create response: %s", string(body))

		if createResp.StatusCode != 200 {
			log.Printf("❌ BBB a retourné une erreur: %d", createResp.StatusCode)
			bbbRespondError(w, fmt.Sprintf("BBB server error: %d", createResp.StatusCode), http.StatusInternalServerError)
			return
		}
	} else {
		log.Printf("✅ Réunion %s existe déjà → Pas de création, uniquement join", req.MeetingID)
	}

	joinURL := generateJoinURL(req.MeetingID, req.UserName, req.IsModerator)
	log.Printf("🔗 Join URL généré: %s", joinURL)

	json.NewEncoder(w).Encode(JoinResponse{
		Success: true,
		URL:     joinURL,
	})
}

func checkMeetingExists(meetingID string) (bool, error) {
	params := url.Values{}
	params.Set("meetingID", meetingID)

	apiCall := "getMeetingInfo"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	checkURL := fmt.Sprintf("%s/bigbluebutton/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	log.Printf("Vérification existence réunion: %s", meetingID)

	resp, err := http.Get(checkURL)
	if err != nil {
		log.Printf("Erreur HTTP lors de la vérification: %v", err)
		return false, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	bodyStr := string(body)
	log.Printf("Response getMeetingInfo: %s", bodyStr)

	if strings.Contains(bodyStr, "FAILED") || strings.Contains(bodyStr, "notFound") || strings.Contains(bodyStr, "Meeting not found") {
		log.Printf("Réunion n'existe pas")
		return false, nil
	}

	if strings.Contains(bodyStr, "SUCCESS") {
		log.Printf("✅ Réunion existe déjà")
		return true, nil
	}

	log.Printf("⚠️ Réponse ambiguë, on considère que la réunion n'existe pas")
	return false, nil
}

func createMeeting(meetingID string) (string, error) {
	params := url.Values{}
	params.Set("name", "Réunion "+meetingID)
	params.Set("meetingID", meetingID)
	params.Set("attendeePW", "ap")
	params.Set("moderatorPW", "mp")

	// Micro et caméra
	params.Set("muteOnStart", "false")
	params.Set("lockSettingsDisableMic", "false")
	params.Set("lockSettingsDisableCam", "false")
	params.Set("webcamsOnlyForModerator", "false")

	// Chat
	params.Set("lockSettingsDisablePrivateChat", "false")
	params.Set("lockSettingsDisablePublicChat", "false")

	// Autres
	params.Set("lockSettingsDisableNote", "false")
	params.Set("guestPolicy", "ALWAYS_ACCEPT")
	params.Set("maxParticipants", "0")

	// Enregistrement
	params.Set("record", "false")
	params.Set("autoStartRecording", "false")
	params.Set("allowStartStopRecording", "true")

	apiCall := "create"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	return fmt.Sprintf("%s/bigbluebutton/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum), nil
}

func generateJoinURL(meetingID, userName string, isModerator bool) string {
	params := url.Values{}
	params.Set("fullName", userName)
	params.Set("meetingID", meetingID)

	if isModerator {
		params.Set("password", "mp")
	} else {
		params.Set("password", "ap")
	}

	params.Set("redirect", "true")

	apiCall := "join"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	return fmt.Sprintf("%s/bigbluebutton/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)
}

func calculateChecksum(data string) string {
	hash := sha1.New()
	hash.Write([]byte(data))
	return hex.EncodeToString(hash.Sum(nil))
}

func handleMuteAll(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MeetingID string `json:"meetingID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		bbbRespondError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", req.MeetingID)

	apiCall := "muteAllUsers"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	muteURL := fmt.Sprintf("%s/bigbluebutton/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(muteURL)
	if err != nil {
		bbbRespondError(w, "Failed to mute all users", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("🔇 Muted all users in meeting %s", req.MeetingID)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func handleMuteUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MeetingID string `json:"meetingID"`
		UserID    string `json:"userID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		bbbRespondError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", req.MeetingID)
	params.Set("userID", req.UserID)

	apiCall := "muteUser"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	muteURL := fmt.Sprintf("%s/bigbluebutton/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(muteURL)
	if err != nil {
		bbbRespondError(w, "Failed to mute user", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("🔇 Muted user %s in meeting %s", req.UserID, req.MeetingID)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func handleEjectUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MeetingID string `json:"meetingID"`
		UserID    string `json:"userID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		bbbRespondError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", req.MeetingID)
	params.Set("userID", req.UserID)

	apiCall := "ejectUser"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	ejectURL := fmt.Sprintf("%s/bigbluebutton/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(ejectURL)
	if err != nil {
		bbbRespondError(w, "Failed to eject user", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("🚫 Ejected user %s from meeting %s", req.UserID, req.MeetingID)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func handleGetParticipants(w http.ResponseWriter, r *http.Request) {
	meetingID := r.URL.Query().Get("meetingID")
	if meetingID == "" {
		bbbRespondError(w, "meetingID is required", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", meetingID)

	apiCall := "getMeetingInfo"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	infoURL := fmt.Sprintf("%s/bigbluebutton/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(infoURL)
	if err != nil {
		bbbRespondError(w, "Failed to get meeting info", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":      true,
		"participants": []map[string]interface{}{},
	})
}
