package main

import (
	"database/sql"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Auth types
type User struct {
	ID           int        `json:"id"`
	Email        string     `json:"email"`
	Name         string     `json:"name"`
	PasswordHash string     `json:"-"`
	Role         string     `json:"role,omitempty"`
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

func initDB() error {
	var err error

	db, err = sql.Open("sqlite3", "./mam_auth.db")
	if err != nil {
		return err
	}

	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id            INTEGER  PRIMARY KEY AUTOINCREMENT,
		email         TEXT     UNIQUE NOT NULL,
		password_hash TEXT     NOT NULL,
		name          TEXT     NOT NULL,
		role          TEXT     NOT NULL DEFAULT 'visiteur',
		is_active     INTEGER  NOT NULL DEFAULT 1,
		avatar_config TEXT,
		created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_login    DATETIME
	);

	CREATE TABLE IF NOT EXISTS password_resets (
		id         INTEGER  PRIMARY KEY AUTOINCREMENT,
		user_id    INTEGER  NOT NULL,
		token      TEXT     UNIQUE NOT NULL,
		expires_at DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
	CREATE INDEX IF NOT EXISTS idx_password_resets_token   ON password_resets(token);
	CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
	`

	_, err = db.Exec(schema)
	if err != nil {
		return err
	}

	log.Println(" Database initialized successfully")

	// Seed default superadmin if no users exist
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("rtNGsxMpjw"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		_, err = db.Exec(
			"INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
			"mam@ac-creteil.fr", string(hashedPassword), "mam mam", "superadmin",
		)
		if err != nil {
			return err
		}

		log.Println("🌱 Seed superadmin created: mam@ac-creteil.fr")
	}

	return nil
}
