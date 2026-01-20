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

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

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

func main() {
	// Charger .env
	if err := godotenv.Load(); err != nil {
		log.Println("Aucun fichier .env trouvé")
	}

	bbbURL = os.Getenv("BBB_URL")
	bbbSecret = os.Getenv("BBB_SECRET")

	if bbbURL == "" || bbbSecret == "" {
		log.Fatal("BBB_URL et BBB_SECRET doivent être définis dans .env")
	}

	router := mux.NewRouter()

	// Routes
	router.HandleFunc("/api/bbb/join", handleJoinMeeting).Methods("POST")
	router.HandleFunc("/api/bbb/mute-all", handleMuteAll).Methods("POST")
	router.HandleFunc("/api/bbb/mute-user", handleMuteUser).Methods("POST")
	router.HandleFunc("/api/bbb/eject-user", handleEjectUser).Methods("POST")
	router.HandleFunc("/api/bbb/participants", handleGetParticipants).Methods("GET")
	router.HandleFunc("/health", handleHealth).Methods("GET")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"}, // Ajoute tes domaines
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Serveur BBB backend démarré sur le port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func handleJoinMeeting(w http.ResponseWriter, r *http.Request) {
	var req JoinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validation
	if req.MeetingID == "" || req.UserName == "" {
		respondError(w, "meetingID and userName are required", http.StatusBadRequest)
		return
	}

	// 1. Créer la réunion (si elle n'existe pas déjà, BBB ignore les doublons)
	createURL, err := createMeeting(req.MeetingID)
	if err != nil {
		log.Printf("❌ Erreur création réunion: %v", err)
		respondError(w, "Failed to create meeting", http.StatusInternalServerError)
		return
	}

	log.Printf("📝 Create meeting URL: %s", createURL)

	// ✅ IMPORTANT : Appeler l'API BBB pour VRAIMENT créer la réunion
	createResp, err := http.Get(createURL)
	if err != nil {
		log.Printf("❌ Erreur lors de l'appel create: %v", err)
		respondError(w, "Failed to create meeting", http.StatusInternalServerError)
		return
	}
	defer createResp.Body.Close()

	// Lire la réponse pour vérifier
	body, _ := io.ReadAll(createResp.Body)
	log.Printf("✅ BBB create response status: %d", createResp.StatusCode)
	log.Printf("📄 BBB create response: %s", string(body))

	// 2. Générer le lien de participation
	joinURL := generateJoinURL(req.MeetingID, req.UserName, req.IsModerator)
	log.Printf("🔗 Join URL: %s", joinURL)

	// 3. Retourner le lien
	json.NewEncoder(w).Encode(JoinResponse{
		Success: true,
		URL:     joinURL,
	})
}

func createMeeting(meetingID string) (string, error) {
	params := url.Values{}
	params.Set("name", "Réunion "+meetingID)
	params.Set("meetingID", meetingID)
	params.Set("attendeePW", "ap")  // Mot de passe participant
	params.Set("moderatorPW", "mp") // Mot de passe modérateur

	// 🎯 PARAMÈTRES DE CONTRÔLE IMPORTANTS
	// Micro et caméra
	params.Set("muteOnStart", "false")             // true = micro coupé au départ
	params.Set("lockSettingsDisableMic", "false")  // true = empêche activation micro
	params.Set("lockSettingsDisableCam", "false")  // true = empêche activation caméra
	params.Set("webcamsOnlyForModerator", "false") // true = caméra uniquement modérateurs

	// Chat
	params.Set("lockSettingsDisablePrivateChat", "false") // true = bloque chat privé
	params.Set("lockSettingsDisablePublicChat", "false")  // true = bloque chat public

	// Autres
	params.Set("lockSettingsDisableNote", "false") // true = bloque notes partagées
	params.Set("guestPolicy", "ALWAYS_ACCEPT")     // ALWAYS_ACCEPT, ALWAYS_DENY, ASK_MODERATOR
	params.Set("maxParticipants", "0")             // 0 = illimité

	// Enregistrement
	params.Set("record", "false")                 // true = enregistrer
	params.Set("autoStartRecording", "false")     // true = démarre automatiquement
	params.Set("allowStartStopRecording", "true") // true = permet contrôle enregistrement

	apiCall := "create"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	return fmt.Sprintf("%s/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum), nil
}

func generateJoinURL(meetingID, userName string, isModerator bool) string {
	params := url.Values{}
	params.Set("fullName", userName)
	params.Set("meetingID", meetingID)

	// Choisir le mot de passe selon le rôle
	if isModerator {
		params.Set("password", "mp")
	} else {
		params.Set("password", "ap")
	}

	params.Set("redirect", "true")

	apiCall := "join"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	return fmt.Sprintf("%s/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)
}

func calculateChecksum(data string) string {
	hash := sha1.New()
	hash.Write([]byte(data))
	return hex.EncodeToString(hash.Sum(nil))
}

func respondError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(JoinResponse{
		Success: false,
		Error:   message,
	})
}

// Couper tous les micros
func handleMuteAll(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MeetingID string `json:"meetingID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", req.MeetingID)

	apiCall := "muteAllUsers"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	muteURL := fmt.Sprintf("%s/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(muteURL)
	if err != nil {
		respondError(w, "Failed to mute all users", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("🔇 Muted all users in meeting %s", req.MeetingID)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Couper le micro d'un utilisateur spécifique
func handleMuteUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MeetingID string `json:"meetingID"`
		UserID    string `json:"userID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", req.MeetingID)
	params.Set("userID", req.UserID)

	apiCall := "muteUser"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	muteURL := fmt.Sprintf("%s/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(muteURL)
	if err != nil {
		respondError(w, "Failed to mute user", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("🔇 Muted user %s in meeting %s", req.UserID, req.MeetingID)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Éjecter un utilisateur
func handleEjectUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MeetingID string `json:"meetingID"`
		UserID    string `json:"userID"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", req.MeetingID)
	params.Set("userID", req.UserID)

	apiCall := "ejectUser"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	ejectURL := fmt.Sprintf("%s/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(ejectURL)
	if err != nil {
		respondError(w, "Failed to eject user", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	log.Printf("⛔ Ejected user %s from meeting %s", req.UserID, req.MeetingID)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Récupérer la liste des participants
func handleGetParticipants(w http.ResponseWriter, r *http.Request) {
	meetingID := r.URL.Query().Get("meetingID")
	if meetingID == "" {
		respondError(w, "meetingID is required", http.StatusBadRequest)
		return
	}

	params := url.Values{}
	params.Set("meetingID", meetingID)

	apiCall := "getMeetingInfo"
	queryString := params.Encode()
	checksum := calculateChecksum(apiCall + queryString + bbbSecret)

	infoURL := fmt.Sprintf("%s/api/%s?%s&checksum=%s", bbbURL, apiCall, queryString, checksum)

	resp, err := http.Get(infoURL)
	if err != nil {
		respondError(w, "Failed to get meeting info", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Note: Tu devras parser le XML de réponse BBB pour extraire les participants
	// Pour l'instant, on retourne juste un exemple
	// En production, utilise encoding/xml pour parser la réponse BBB

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":      true,
		"participants": []map[string]interface{}{
			// TODO: Parser la vraie réponse XML de BBB
			// Pour l'instant, exemple statique
		},
	})
}
