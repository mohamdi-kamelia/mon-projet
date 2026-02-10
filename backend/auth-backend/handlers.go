package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret []byte

func generateJWT(userID int) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func generateResetToken() string {
	return jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"random": time.Now().UnixNano(),
	}).Raw
}

func respondJSON(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, message string, statusCode int) {
	respondJSON(w, ErrorResponse{Error: message}, statusCode)
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondError(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			respondError(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

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

		ctx := context.WithValue(r.Context(), "user_id", int(userID))
		next(w, r.WithContext(ctx))
	}
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondError(w, "Email, password, and name are required", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 6 {
		respondError(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, "Error processing password", http.StatusInternalServerError)
		return
	}

	result, err := db.Exec(
		"INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
		req.Email, string(hashedPassword), req.Name,
	)
	if err != nil {
		respondError(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	userID, _ := result.LastInsertId()

	var user User
	err = db.QueryRow(
		"SELECT id, email, name, created_at FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt)

	if err != nil {
		respondError(w, "Error retrieving user", http.StatusInternalServerError)
		return
	}

	token, err := generateJWT(user.ID)
	if err != nil {
		respondError(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ User registered: %s (ID: %d)", user.Email, user.ID)

	respondJSON(w, LoginResponse{Token: token, User: user}, http.StatusCreated)
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, "Email and password are required", http.StatusBadRequest)
		return
	}

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

	if avatarConfig.Valid {
		user.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		user.LastLogin = &lastLogin.Time
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		respondError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	now := time.Now()
	db.Exec("UPDATE users SET last_login = ? WHERE id = ?", now, user.ID)
	user.LastLogin = &now

	token, err := generateJWT(user.ID)
	if err != nil {
		respondError(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ User logged in: %s (ID: %d)", user.Email, user.ID)

	respondJSON(w, LoginResponse{Token: token, User: user}, http.StatusOK)
}

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

	if avatarConfig.Valid {
		user.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		user.LastLogin = &lastLogin.Time
	}

	respondJSON(w, user, http.StatusOK)
}

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

	query := "UPDATE users SET "
	args := []interface{}{}
	count := 0

	if updates.Name != nil && *updates.Name != "" {
		if count > 0 {
			query += ", "
		}
		query += "name = ?"
		args = append(args, *updates.Name)
		count++
	}

	if updates.AvatarConfig != nil {
		if count > 0 {
			query += ", "
		}
		query += "avatar_config = ?"
		args = append(args, *updates.AvatarConfig)
		count++
	}

	if count == 0 {
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

	if avatarConfig.Valid {
		user.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		user.LastLogin = &lastLogin.Time
	}

	log.Printf("✅ Profile updated: User ID %d", userID)
	respondJSON(w, user, http.StatusOK)
}

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

	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&userID)
	if err != nil {
		respondJSON(w, SuccessResponse{
			Message: "If the email exists, a reset link has been sent",
		}, http.StatusOK)
		return
	}

	resetToken := generateResetToken()
	expiresAt := time.Now().Add(1 * time.Hour)

	_, err = db.Exec(
		"INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
		userID, resetToken, expiresAt,
	)
	if err != nil {
		respondError(w, "Error creating reset token", http.StatusInternalServerError)
		return
	}

	log.Printf("🔑 Password reset token for user %d: %s", userID, resetToken)
	log.Printf("📧 Reset link: http://localhost:5173/reset-password?token=%s", resetToken)

	respondJSON(w, SuccessResponse{
		Message: "If the email exists, a reset link has been sent",
	}, http.StatusOK)
}

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

	if time.Now().After(expiresAt) {
		respondError(w, "Token has expired", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, "Error processing password", http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(hashedPassword), userID)
	if err != nil {
		respondError(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	db.Exec("DELETE FROM password_resets WHERE token = ?", req.Token)

	log.Printf("✅ Password reset for user ID %d", userID)

	respondJSON(w, SuccessResponse{Message: "Password successfully reset"}, http.StatusOK)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, map[string]string{"status": "ok"}, http.StatusOK)
}
