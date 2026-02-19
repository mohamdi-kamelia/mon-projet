package users

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// Repository handles all DB operations for users and groups.
type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Migrate() error {
	schema := `
	-- Extend users table with role and is_active
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

	CREATE TABLE IF NOT EXISTS groups (
		id          INTEGER  PRIMARY KEY AUTOINCREMENT,
		name        TEXT     NOT NULL,
		description TEXT,
		role        TEXT     NOT NULL DEFAULT 'visiteur',
		created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS group_members (
		group_id INTEGER NOT NULL,
		user_id  INTEGER NOT NULL,
		PRIMARY KEY (group_id, user_id),
		FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
	CREATE INDEX IF NOT EXISTS idx_group_members_uid  ON group_members(user_id);
	CREATE INDEX IF NOT EXISTS idx_pr_token           ON password_resets(token);
	`
	_, err := r.db.Exec(schema)
	return err
}

// ─── User queries ───

func (r *Repository) ListUsers(page, pageSize int, search, roleFilter string) ([]User, int, error) {
	conditions := []string{}
	args := []interface{}{}

	if search != "" {
		conditions = append(conditions, "(name LIKE ? OR email LIKE ?)")
		like := "%" + search + "%"
		args = append(args, like, like)
	}
	if roleFilter != "" {
		conditions = append(conditions, "role = ?")
		args = append(args, roleFilter)
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	// total count
	var total int
	countArgs := make([]interface{}, len(args))
	copy(countArgs, args)
	err := r.db.QueryRow("SELECT COUNT(*) FROM users "+where, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(
		`SELECT id, email, name, role, is_active, avatar_config, created_at, last_login
		 FROM users `+where+` ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		args...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, u)
	}
	return list, total, nil
}

func (r *Repository) GetUserByID(id int) (*User, error) {
	row := r.db.QueryRow(
		`SELECT id, email, name, role, is_active, avatar_config, created_at, last_login
		 FROM users WHERE id = ?`, id)
	u, err := scanUser(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &u, err
}

func (r *Repository) GetUserByEmail(email string) (*User, error) {
	row := r.db.QueryRow(
		`SELECT id, email, name, password_hash, role, is_active, avatar_config, created_at, last_login
		 FROM users WHERE email = ?`, email)

	var u User
	var avatarConfig sql.NullString
	var lastLogin sql.NullTime

	err := row.Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.Role,
		&u.IsActive, &avatarConfig, &u.CreatedAt, &lastLogin)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if avatarConfig.Valid {
		u.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		u.LastLogin = &lastLogin.Time
	}
	return &u, nil
}

func (r *Repository) EmailExists(email string) (bool, error) {
	var exists bool
	err := r.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", email).Scan(&exists)
	return exists, err
}

func (r *Repository) CreateUser(email, passwordHash, name string, role RoleID) (*User, error) {
	result, err := r.db.Exec(
		`INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)`,
		email, passwordHash, name, role,
	)
	if err != nil {
		return nil, err
	}
	id, _ := result.LastInsertId()
	return r.GetUserByID(int(id))
}

func (r *Repository) UpdateUser(id int, req UpdateUserRequest) (*User, error) {
	parts := []string{}
	args := []interface{}{}

	if req.Name != nil && *req.Name != "" {
		parts = append(parts, "name = ?")
		args = append(args, *req.Name)
	}
	if req.Role != nil {
		parts = append(parts, "role = ?")
		args = append(args, *req.Role)
	}
	if req.IsActive != nil {
		val := 0
		if *req.IsActive {
			val = 1
		}
		parts = append(parts, "is_active = ?")
		args = append(args, val)
	}
	if len(parts) == 0 {
		return r.GetUserByID(id)
	}

	args = append(args, id)
	_, err := r.db.Exec(
		"UPDATE users SET "+strings.Join(parts, ", ")+" WHERE id = ?",
		args...,
	)
	if err != nil {
		return nil, err
	}
	return r.GetUserByID(id)
}

func (r *Repository) DeleteUser(id int) error {
	_, err := r.db.Exec("DELETE FROM users WHERE id = ?", id)
	return err
}

func (r *Repository) DeleteUsersBulk(ids []int) error {
	if len(ids) == 0 {
		return nil
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		args[i] = id
	}
	_, err := r.db.Exec(fmt.Sprintf("DELETE FROM users WHERE id IN (%s)", placeholders), args...)
	return err
}

func (r *Repository) UpdateLastLogin(id int) error {
	_, err := r.db.Exec("UPDATE users SET last_login = ? WHERE id = ?", time.Now(), id)
	return err
}

func (r *Repository) UpdatePassword(id int, hash string) error {
	_, err := r.db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", hash, id)
	return err
}

func (r *Repository) GetUserRole(id int) (RoleID, error) {
	var role RoleID
	err := r.db.QueryRow("SELECT role FROM users WHERE id = ?", id).Scan(&role)
	return role, err
}

func (r *Repository) ListGroups() ([]Group, error) {
	rows, err := r.db.Query(
		`SELECT id, name, description, role, created_at FROM groups ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var g Group
		var desc sql.NullString
		if err := rows.Scan(&g.ID, &g.Name, &desc, &g.Role, &g.CreatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			g.Description = desc.String
		}
		g.Members, err = r.getGroupMemberIDs(g.ID)
		if err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, nil
}

func (r *Repository) GetGroupByID(id int) (*Group, error) {
	var g Group
	var desc sql.NullString
	err := r.db.QueryRow(
		`SELECT id, name, description, role, created_at FROM groups WHERE id = ?`, id,
	).Scan(&g.ID, &g.Name, &desc, &g.Role, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		g.Description = desc.String
	}
	g.Members, err = r.getGroupMemberIDs(g.ID)
	return &g, err
}

func (r *Repository) CreateGroup(req CreateGroupRequest) (*Group, error) {
	result, err := r.db.Exec(
		`INSERT INTO groups (name, description, role) VALUES (?, ?, ?)`,
		req.Name, req.Description, req.Role,
	)
	if err != nil {
		return nil, err
	}
	id, _ := result.LastInsertId()
	if err := r.setGroupMembers(int(id), req.Members); err != nil {
		return nil, err
	}
	return r.GetGroupByID(int(id))
}

func (r *Repository) UpdateGroup(id int, req UpdateGroupRequest) (*Group, error) {
	parts := []string{}
	args := []interface{}{}

	if req.Name != nil {
		parts = append(parts, "name = ?")
		args = append(args, *req.Name)
	}
	if req.Description != nil {
		parts = append(parts, "description = ?")
		args = append(args, *req.Description)
	}
	if req.Role != nil {
		parts = append(parts, "role = ?")
		args = append(args, *req.Role)
	}
	if len(parts) > 0 {
		args = append(args, id)
		_, err := r.db.Exec(
			"UPDATE groups SET "+strings.Join(parts, ", ")+" WHERE id = ?", args...)
		if err != nil {
			return nil, err
		}
	}
	if req.Members != nil {
		if err := r.setGroupMembers(id, req.Members); err != nil {
			return nil, err
		}
	}
	return r.GetGroupByID(id)
}

func (r *Repository) DeleteGroup(id int) error {
	_, err := r.db.Exec("DELETE FROM groups WHERE id = ?", id)
	return err
}

// setGroupMembers replaces all members of a group (full replace strategy).
func (r *Repository) setGroupMembers(groupID int, userIDs []int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM group_members WHERE group_id = ?", groupID); err != nil {
		return err
	}
	for _, uid := range userIDs {
		if _, err := tx.Exec(
			"INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)", groupID, uid); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *Repository) getGroupMemberIDs(groupID int) ([]int, error) {
	rows, err := r.db.Query("SELECT user_id FROM group_members WHERE group_id = ?", groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	if ids == nil {
		ids = []int{}
	}
	return ids, nil
}

// ─── Password resets ─────

func (r *Repository) CreatePasswordReset(userID int, token string, expiresAt time.Time) error {
	_, err := r.db.Exec(
		`INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`,
		userID, token, expiresAt,
	)
	return err
}

func (r *Repository) GetPasswordReset(token string) (int, time.Time, error) {
	var userID int
	var expiresAt time.Time
	err := r.db.QueryRow(
		"SELECT user_id, expires_at FROM password_resets WHERE token = ?", token,
	).Scan(&userID, &expiresAt)
	return userID, expiresAt, err
}

func (r *Repository) DeletePasswordReset(token string) error {
	_, err := r.db.Exec("DELETE FROM password_resets WHERE token = ?", token)
	return err
}

// ─── Helpers ──────

type scannable interface {
	Scan(dest ...interface{}) error
}

func scanUser(row scannable) (User, error) {
	var u User
	var avatarConfig sql.NullString
	var lastLogin sql.NullTime
	var isActive int

	err := row.Scan(
		&u.ID, &u.Email, &u.Name, &u.Role,
		&isActive, &avatarConfig, &u.CreatedAt, &lastLogin,
	)
	if err != nil {
		return u, err
	}
	u.IsActive = isActive == 1
	if avatarConfig.Valid {
		u.AvatarConfig = avatarConfig.String
	}
	if lastLogin.Valid {
		u.LastLogin = &lastLogin.Time
	}
	return u, nil
}
