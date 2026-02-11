package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
)

// Common response helpers
func respondJSON(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, message string, statusCode int) {
	respondJSON(w, ErrorResponse{Error: message}, statusCode)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, map[string]string{"status": "ok"}, http.StatusOK)
}

func main() {
	// Charger les variables d'environnement
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using defaults")
	}

	// Configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Init auth (JWT secret)
	initAuth()

	// Init database
	if err := initDB(); err != nil {
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Init BBB config
	initBBB()

	// Router
	router := mux.NewRouter()

	// Health check
	router.HandleFunc("/health", handleHealth).Methods("GET")

	// Auth routes (public)
	router.HandleFunc("/api/auth/register", handleRegister).Methods("POST")
	router.HandleFunc("/api/auth/login", handleLogin).Methods("POST")
	router.HandleFunc("/api/auth/forgot-password", handleForgotPassword).Methods("POST")
	router.HandleFunc("/api/auth/reset-password", handleResetPassword).Methods("POST")

	// Auth routes (protected)
	router.HandleFunc("/api/auth/me", authMiddleware(handleGetMe)).Methods("GET")
	router.HandleFunc("/api/auth/profile", authMiddleware(handleUpdateProfile)).Methods("PUT")

	// BBB routes
	router.HandleFunc("/api/bbb/join", handleJoinMeeting).Methods("POST")
	router.HandleFunc("/api/bbb/mute-all", handleMuteAll).Methods("POST")
	router.HandleFunc("/api/bbb/mute-user", handleMuteUser).Methods("POST")
	router.HandleFunc("/api/bbb/eject-user", handleEjectUser).Methods("POST")
	router.HandleFunc("/api/bbb/participants", handleGetParticipants).Methods("GET")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	// Démarrer le serveur
	log.Printf("🚀 Backend started on port %s", port)
	log.Printf("🔗 API URL: http://localhost:%s", port)
	log.Printf("📊 Database: ./mam_auth.db (SQLite)")
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
