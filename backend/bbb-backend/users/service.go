package users

import (
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Common service errors
var (
	ErrEmailExists      = errors.New("email already registered")
	ErrUserNotFound     = errors.New("user not found")
	ErrGroupNotFound    = errors.New("group not found")
	ErrInvalidRole      = errors.New("invalid role")
	ErrForbidden        = errors.New("insufficient permissions to assign this role")
	ErrWeakPassword     = errors.New("password must be at least 6 characters")
	ErrInvalidToken     = errors.New("invalid or expired token")
	ErrNoFieldsToUpdate = errors.New("no fields to update")
)

// Service holds business logic for account and permission management.
type Service struct {
	repo      *Repository
	jwtSecret []byte
}

func NewService(repo *Repository, jwtSecret []byte) *Service {
	return &Service{repo: repo, jwtSecret: jwtSecret}
}

// ─── JWT ───────

func (s *Service) GenerateJWT(userID int) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// ─── Users ──────

func (s *Service) ListUsers(page, pageSize int, search, roleFilter string) (PaginatedUsers, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	list, total, err := s.repo.ListUsers(page, pageSize, search, roleFilter)
	if err != nil {
		return PaginatedUsers{}, err
	}

	totalPages := (total + pageSize - 1) / pageSize
	return PaginatedUsers{
		Users:      orEmpty(list),
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *Service) GetUser(id int) (*User, error) {
	u, err := s.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, ErrUserNotFound
	}
	return u, nil
}

// CreateUser can only be called by callers with PermManageUsers.
// The caller cannot assign a role equal to or above their own level.
func (s *Service) CreateUser(callerRole RoleID, req CreateUserRequest) (*User, error) {
	if !HasPermission(callerRole, PermManageUsers) {
		return nil, ErrForbidden
	}
	if !req.Role.IsValid() {
		req.Role = RoleVisiteur
	}
	if !callerRole.CanManage(req.Role) {
		return nil, ErrForbidden
	}
	if len(req.Password) < 6 {
		return nil, ErrWeakPassword
	}

	exists, err := s.repo.EmailExists(req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u, err := s.repo.CreateUser(req.Email, string(hash), req.Name, req.Role)
	if err != nil {
		return nil, err
	}
	log.Printf("✅ User created: %s (role: %s)", u.Email, u.Role)
	return u, nil
}

// UpdateUser enforces hierarchy: caller cannot change a user to a role >= their own.
func (s *Service) UpdateUser(callerRole RoleID, targetID int, req UpdateUserRequest) (*User, error) {
	if req.Role != nil {
		if !req.Role.IsValid() {
			return nil, ErrInvalidRole
		}
		// Need at least manage_roles or manage_roles_low + hierarchy check
		canManageRoles := HasPermission(callerRole, PermManageRoles) ||
			HasPermission(callerRole, PermManageRolesLow)
		if !canManageRoles {
			return nil, ErrForbidden
		}
		if !callerRole.CanManage(*req.Role) {
			return nil, ErrForbidden
		}
	}

	u, err := s.repo.UpdateUser(targetID, req)
	if err != nil {
		return nil, err
	}
	if u == nil {
		return nil, ErrUserNotFound
	}
	log.Printf("✅ User updated: ID %d", targetID)
	return u, nil
}

func (s *Service) DeleteUser(callerRole RoleID, callerID, targetID int) error {
	if !HasPermission(callerRole, PermManageUsers) {
		return ErrForbidden
	}
	if callerID == targetID {
		return errors.New("cannot delete your own account")
	}
	// Check target's role level vs caller
	targetRole, err := s.repo.GetUserRole(targetID)
	if err != nil {
		return ErrUserNotFound
	}
	if !callerRole.CanManage(targetRole) {
		return ErrForbidden
	}
	return s.repo.DeleteUser(targetID)
}

func (s *Service) DeleteUsersBulk(callerRole RoleID, callerID int, ids []int) error {
	if !HasPermission(callerRole, PermManageUsers) {
		return ErrForbidden
	}
	// Filter out caller's own ID and any with higher/equal role
	allowed := []int{}
	for _, id := range ids {
		if id == callerID {
			continue
		}
		targetRole, err := s.repo.GetUserRole(id)
		if err != nil {
			continue
		}
		if callerRole.CanManage(targetRole) {
			allowed = append(allowed, id)
		}
	}
	return s.repo.DeleteUsersBulk(allowed)
}

// ─── Groups ────

func (s *Service) ListGroups() ([]Group, error) {
	groups, err := s.repo.ListGroups()
	return orEmptyGroups(groups), err
}

func (s *Service) GetGroup(id int) (*Group, error) {
	g, err := s.repo.GetGroupByID(id)
	if err != nil {
		return nil, err
	}
	if g == nil {
		return nil, ErrGroupNotFound
	}
	return g, nil
}

func (s *Service) CreateGroup(callerRole RoleID, req CreateGroupRequest) (*Group, error) {
	if !HasPermission(callerRole, PermCreateGT) {
		return nil, ErrForbidden
	}
	if !req.Role.IsValid() {
		return nil, ErrInvalidRole
	}
	g, err := s.repo.CreateGroup(req)
	if err != nil {
		return nil, err
	}
	log.Printf("✅ Group created: %s (role: %s)", g.Name, g.Role)
	return g, nil
}

func (s *Service) UpdateGroup(callerRole RoleID, callerID int, groupID int, req UpdateGroupRequest) (*Group, error) {
	// Check if caller can manage all GTs or only their own
	canAll := HasPermission(callerRole, PermManageAllGT)
	canOwn := HasPermission(callerRole, PermManageOwnGT)

	if !canAll && !canOwn {
		return nil, ErrForbidden
	}

	if req.Role != nil && !req.Role.IsValid() {
		return nil, ErrInvalidRole
	}

	g, err := s.repo.UpdateGroup(groupID, req)
	if err != nil {
		return nil, err
	}
	if g == nil {
		return nil, ErrGroupNotFound
	}
	return g, nil
}

func (s *Service) DeleteGroup(callerRole RoleID, id int) error {
	if !HasPermission(callerRole, PermManageAllGT) {
		return ErrForbidden
	}
	return s.repo.DeleteGroup(id)
}

// ─── Password reset ──────────

func (s *Service) ForgotPassword(email string) error {
	u, err := s.repo.GetUserByEmail(email)
	if err != nil || u == nil {
		// Silently succeed to avoid email enumeration
		return nil
	}

	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"reset": u.ID, "exp": time.Now().Add(1 * time.Hour).Unix(),
	}).SignedString(s.jwtSecret)

	expiresAt := time.Now().Add(1 * time.Hour)
	if err := s.repo.CreatePasswordReset(u.ID, token, expiresAt); err != nil {
		return err
	}

	// TODO: send email
	log.Printf("🔑 Password reset token for %s: %s", email, token)
	return nil
}

func (s *Service) ResetPassword(token, newPassword string) error {
	if len(newPassword) < 6 {
		return ErrWeakPassword
	}

	userID, expiresAt, err := s.repo.GetPasswordReset(token)
	if err != nil {
		return ErrInvalidToken
	}
	if time.Now().After(expiresAt) {
		return ErrInvalidToken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if err := s.repo.UpdatePassword(userID, string(hash)); err != nil {
		return err
	}
	_ = s.repo.DeletePasswordReset(token)
	log.Printf(" Password reset for user ID %d", userID)
	return nil
}

// ─── Helpers ──────────

func orEmpty(s []User) []User {
	if s == nil {
		return []User{}
	}
	return s
}

func orEmptyGroups(s []Group) []Group {
	if s == nil {
		return []Group{}
	}
	return s
}
