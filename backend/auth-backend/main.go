package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int        `json:"id"`
	Email        string     `json:"email"`
	Name         string     `json:"name"`
	PasswordHash string     `json:"-"`
	AvatarConfig string     `json:"avatar_config,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	LastLogin    *time.Time `json:"last_login,omitempty"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

var db *sql.DB
var jwtSecret []byte

func initDB() error {
	var err error

	db, err = sql.Open("sqlite3", "./mam_auth.db")
	if err != nil {
		return err
	}

	// Créer les tables
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		name TEXT NOT NULL,
		avatar_config TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_login DATETIME
	);

	CREATE TABLE IF NOT EXISTS password_resets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		token TEXT UNIQUE NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
	CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
	`

	_, err = db.Exec(schema)
	if err != nil {
		return err
	}

	log.Println("✅ Database initialized successfully")
	return nil
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validation
	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondError(w, "Email, password, and name are required", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 6 {
		respondError(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	// Vérifier si l'email existe déjà
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", req.Email).Scan(&exists)
	if err != nil {
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}

	if exists {
		respondError(w, "Email already registered", http.StatusConflict)
		return
	}

	// Hasher le mot de passe
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, "Error processing password", http.StatusInternalServerError)
		return
	}

	// Insérer l'utilisateur
	result, err := db.Exec(
		"INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
		req.Email, string(hashedPassword), req.Name,
	)
	if err != nil {
		respondError(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	userID, _ := result.LastInsertId()

	// Récupérer l'utilisateur créé
	var user User
	err = db.QueryRow(
		"SELECT id, email, name, created_at FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt)

	if err != nil {
		respondError(w, "Error retrieving user", http.StatusInternalServerError)
		return
	}

	// Générer le token JWT
	token, err := generateJWT(user.ID)
	if err != nil {
		respondError(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ User registered: %s (ID: %d)", user.Email, user.ID)

	respondJSON(w, LoginResponse{
		Token: token,
		User:  user,
	}, http.StatusCreated)
}

// Login - Connexion d'un utilisateur
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validation
	if req.Email == "" || req.Password == "" {
		respondError(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// Récupérer l'utilisateur
	var user User
	var avatarConfig sql.NullString
	var lastLogin sql.NullTime

	err := db.QueryRow(
		"SELECT id, email, password_hash, name, avatar_config, created_at, last_login FROM users WHERE email = ?",
		req.Email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &avatarConfig, &user.CreatedAt, &lastLogin)

	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}
		log.Printf("❌ Database error in login: %v", err)
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Convertir les valeurs NULL
	if avatarConfig.Valid {
		user.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		user.LastLogin = &lastLogin.Time
	}

	// Vérifier le mot de passe
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		respondError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Mettre à jour last_login
	now := time.Now()
	_, err = db.Exec("UPDATE users SET last_login = ? WHERE id = ?", now, user.ID)
	if err != nil {
		log.Printf("⚠️ Failed to update last_login: %v", err)
	}
	user.LastLogin = &now

	// Générer le token JWT
	token, err := generateJWT(user.ID)
	if err != nil {
		respondError(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ User logged in: %s (ID: %d)", user.Email, user.ID)

	respondJSON(w, LoginResponse{
		Token: token,
		User:  user,
	}, http.StatusOK)
}

// GetMe - Récupérer l'utilisateur courant
func handleGetMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var user User
	var avatarConfig sql.NullString
	var lastLogin sql.NullTime

	err := db.QueryRow(
		"SELECT id, email, name, avatar_config, created_at, last_login FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &avatarConfig, &user.CreatedAt, &lastLogin)

	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, "User not found", http.StatusNotFound)
			return
		}
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Convertir les valeurs NULL
	if avatarConfig.Valid {
		user.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		user.LastLogin = &lastLogin.Time
	}

	respondJSON(w, user, http.StatusOK)
}

// UpdateProfile - Mettre à jour le profil utilisateur
func handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	var updates struct {
		Name         *string `json:"name"`
		AvatarConfig *string `json:"avatar_config"`
	}

	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Construire la requête UPDATE dynamiquement
	query := "UPDATE users SET "
	args := []interface{}{}
	updates_count := 0

	if updates.Name != nil && *updates.Name != "" {
		if updates_count > 0 {
			query += ", "
		}
		query += "name = ?"
		args = append(args, *updates.Name)
		updates_count++
	}

	if updates.AvatarConfig != nil {
		if updates_count > 0 {
			query += ", "
		}
		query += "avatar_config = ?"
		args = append(args, *updates.AvatarConfig)
		updates_count++
	}

	if updates_count == 0 {
		respondError(w, "No fields to update", http.StatusBadRequest)
		return
	}

	query += " WHERE id = ?"
	args = append(args, userID)

	_, err := db.Exec(query, args...)
	if err != nil {
		respondError(w, "Error updating profile", http.StatusInternalServerError)
		return
	}

	// Récupérer l'utilisateur mis à jour
	var user User
	var avatarConfig sql.NullString
	var lastLogin sql.NullTime

	err = db.QueryRow(
		"SELECT id, email, name, avatar_config, created_at, last_login FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &avatarConfig, &user.CreatedAt, &lastLogin)

	if err != nil {
		respondError(w, "Error retrieving updated user", http.StatusInternalServerError)
		return
	}

	// Convertir les valeurs NULL
	if avatarConfig.Valid {
		user.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		user.LastLogin = &lastLogin.Time
	}

	log.Printf("✅ Profile updated: User ID %d", userID)

	respondJSON(w, user, http.StatusOK)
}

// ForgotPassword - Demande de réinitialisation du mot de passe
func handleForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		respondError(w, "Email is required", http.StatusBadRequest)
		return
	}

	// Vérifier si l'utilisateur existe
	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&userID)
	if err != nil {
		// Ne pas révéler si l'email existe ou non (sécurité)
		respondJSON(w, SuccessResponse{
			Message: "If the email exists, a reset link has been sent",
		}, http.StatusOK)
		return
	}

	// Générer un token de réinitialisation
	resetToken := generateResetToken()
	expiresAt := time.Now().Add(1 * time.Hour) // Expire dans 1 heure

	// Stocker le token
	_, err = db.Exec(
		"INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
		userID, resetToken, expiresAt,
	)
	if err != nil {
		respondError(w, "Error creating reset token", http.StatusInternalServerError)
		return
	}

	// TODO: Envoyer l'email avec le lien de réinitialisation
	// Pour le moment, on log juste le token (en prod, il faut envoyer un email)
	log.Printf("🔑 Password reset token for user %d: %s", userID, resetToken)
	log.Printf("📧 Reset link: http://localhost:5173/reset-password?token=%s", resetToken)

	respondJSON(w, SuccessResponse{
		Message: "If the email exists, a reset link has been sent",
	}, http.StatusOK)
}

// ResetPassword - Réinitialiser le mot de passe avec un token
func handleResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Token == "" || req.NewPassword == "" {
		respondError(w, "Token and new password are required", http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 6 {
		respondError(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	// Vérifier le token
	var userID int
	var expiresAt time.Time
	err := db.QueryRow(
		"SELECT user_id, expires_at FROM password_resets WHERE token = ?",
		req.Token,
	).Scan(&userID, &expiresAt)

	if err != nil {
		if err == sql.ErrNoRows {
			respondError(w, "Invalid or expired token", http.StatusBadRequest)
			return
		}
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Vérifier si le token n'a pas expiré
	if time.Now().After(expiresAt) {
		respondError(w, "Token has expired", http.StatusBadRequest)
		return
	}

	// Hasher le nouveau mot de passe
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, "Error processing password", http.StatusInternalServerError)
		return
	}

	// Mettre à jour le mot de passe
	_, err = db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(hashedPassword), userID)
	if err != nil {
		respondError(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	// Supprimer le token utilisé
	_, err = db.Exec("DELETE FROM password_resets WHERE token = ?", req.Token)
	if err != nil {
		log.Printf("⚠️ Failed to delete reset token: %v", err)
	}

	log.Printf("✅ Password reset for user ID %d", userID)

	respondJSON(w, SuccessResponse{
		Message: "Password successfully reset",
	}, http.StatusOK)
}

// Health check
func handleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, map[string]string{"status": "ok"}, http.StatusOK)
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Récupérer le token depuis le header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondError(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		// Format: "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			respondError(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		// Valider le token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			respondError(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Extraire les claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			respondError(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["user_id"].(float64)
		if !ok {
			respondError(w, "Invalid user_id in token", http.StatusUnauthorized)
			return
		}

		// Ajouter l'ID utilisateur au contexte
		ctx := context.WithValue(r.Context(), "user_id", int(userID))
		next(w, r.WithContext(ctx))
	}
}

func generateJWT(userID int) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(), // Expire dans 24h
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// Générer un token de réinitialisation aléatoire
func generateResetToken() string {
	return jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"random": time.Now().UnixNano(),
	}).Raw
}

// Répondre avec JSON
func respondJSON(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// Répondre avec une erreur
func respondError(w http.ResponseWriter, message string, statusCode int) {
	respondJSON(w, ErrorResponse{Error: message}, statusCode)
}

func main() {
	// Charger les variables d'environnement
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using defaults")
	}

	// Configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	jwtSecretStr := os.Getenv("JWT_SECRET")
	if jwtSecretStr == "" {
		jwtSecretStr = "default-super-secret-key-change-in-production"
		log.Println("⚠️  Using default JWT_SECRET (change in production!)")
	}
	jwtSecret = []byte(jwtSecretStr)

	// Initialiser la base de données
	if err := initDB(); err != nil {
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Router
	router := mux.NewRouter()

	// Routes publiques
	router.HandleFunc("/health", handleHealth).Methods("GET")
	router.HandleFunc("/api/auth/register", handleRegister).Methods("POST")
	router.HandleFunc("/api/auth/login", handleLogin).Methods("POST")
	router.HandleFunc("/api/auth/forgot-password", handleForgotPassword).Methods("POST")
	router.HandleFunc("/api/auth/reset-password", handleResetPassword).Methods("POST")

	// Routes protégées
	router.HandleFunc("/api/auth/me", authMiddleware(handleGetMe)).Methods("GET")
	router.HandleFunc("/api/auth/profile", authMiddleware(handleUpdateProfile)).Methods("PUT")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	// Démarrer le serveur
	log.Printf("🚀 Auth backend started on port %s", port)
	log.Printf("🔗 API URL: http://localhost:%s", port)
	log.Printf("📊 Database: ./mam_auth.db (SQLite)")
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
