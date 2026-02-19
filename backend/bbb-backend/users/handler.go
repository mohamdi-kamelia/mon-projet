package users

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// Handler wires HTTP routes to the service layer.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes mounts all /api/users and /api/groups routes onto r.
// Call this from main.go.
func (h *Handler) RegisterRoutes(r *mux.Router, svc *Service) {
	// ── Users ──────────────────────────────────────────────────────────────
	// GET    /api/users             list (paginated, filterable)
	// POST   /api/users             create
	// GET    /api/users/{id}        get one
	// PUT    /api/users/{id}        update
	// DELETE /api/users/{id}        delete
	// DELETE /api/users             bulk delete  (body: {"ids":[1,2,3]})

	r.HandleFunc("/api/users", svc.RequirePermission(PermManageUsers, h.ListUsers)).Methods("GET")
	r.HandleFunc("/api/users", svc.RequirePermission(PermManageUsers, h.CreateUser)).Methods("POST")
	r.HandleFunc("/api/users", svc.RequirePermission(PermManageUsers, h.DeleteUsersBulk)).Methods("DELETE")
	r.HandleFunc("/api/users/{id:[0-9]+}", svc.RequireAuth(h.GetUser)).Methods("GET")
	r.HandleFunc("/api/users/{id:[0-9]+}", svc.RequirePermission(PermManageUsers, h.UpdateUser)).Methods("PUT")
	r.HandleFunc("/api/users/{id:[0-9]+}", svc.RequirePermission(PermManageUsers, h.DeleteUser)).Methods("DELETE")

	// ── Groups ─────────────────────────────────────────────────────────────
	// GET    /api/groups            list all
	// POST   /api/groups            create
	// GET    /api/groups/{id}       get one
	// PUT    /api/groups/{id}       update
	// DELETE /api/groups/{id}       delete

	r.HandleFunc("/api/groups", svc.RequireAuth(h.ListGroups)).Methods("GET")
	r.HandleFunc("/api/groups", svc.RequirePermission(PermCreateGT, h.CreateGroup)).Methods("POST")
	r.HandleFunc("/api/groups/{id:[0-9]+}", svc.RequireAuth(h.GetGroup)).Methods("GET")
	r.HandleFunc("/api/groups/{id:[0-9]+}", svc.RequireAuth(h.UpdateGroup)).Methods("PUT")
	r.HandleFunc("/api/groups/{id:[0-9]+}", svc.RequirePermission(PermManageAllGT, h.DeleteGroup)).Methods("DELETE")

	// ── Roles & permissions reference ──────────────────────────────────────
	// GET  /api/roles               list roles with their permissions
	r.HandleFunc("/api/roles", svc.RequireAuth(h.ListRoles)).Methods("GET")
}

// ─── User handlers ────────────────────────────────────────────────────────────

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	pageSize, _ := strconv.Atoi(q.Get("page_size"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	search := q.Get("search")
	roleFilter := q.Get("role")

	result, err := h.svc.ListUsers(page, pageSize, search, roleFilter)
	if err != nil {
		respondError(w, "Failed to list users", http.StatusInternalServerError)
		return
	}
	respondJSON(w, result, http.StatusOK)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := pathID(r, "id")
	if id == 0 {
		respondError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Allow users to view their own profile; admins can view anyone
	callerID := callerIDFromContext(r.Context())
	callerRole := callerRoleFromContext(r.Context())
	if callerID != id && !HasPermission(callerRole, PermManageUsers) {
		respondError(w, "Forbidden", http.StatusForbidden)
		return
	}

	u, err := h.svc.GetUser(id)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			respondError(w, "User not found", http.StatusNotFound)
			return
		}
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}
	respondJSON(w, u, http.StatusOK)
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondError(w, "email, password and name are required", http.StatusBadRequest)
		return
	}

	callerRole := callerRoleFromContext(r.Context())
	u, err := h.svc.CreateUser(callerRole, req)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	respondJSON(w, u, http.StatusCreated)
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := pathID(r, "id")
	if id == 0 {
		respondError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	callerRole := callerRoleFromContext(r.Context())
	u, err := h.svc.UpdateUser(callerRole, id, req)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	respondJSON(w, u, http.StatusOK)
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := pathID(r, "id")
	if id == 0 {
		respondError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}
	callerID := callerIDFromContext(r.Context())
	callerRole := callerRoleFromContext(r.Context())

	if err := h.svc.DeleteUser(callerRole, callerID, id); err != nil {
		respondServiceError(w, err)
		return
	}
	respondJSON(w, map[string]string{"message": "User deleted"}, http.StatusOK)
}

func (h *Handler) DeleteUsersBulk(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDs []int `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || len(body.IDs) == 0 {
		respondError(w, "ids array is required", http.StatusBadRequest)
		return
	}

	callerID := callerIDFromContext(r.Context())
	callerRole := callerRoleFromContext(r.Context())

	if err := h.svc.DeleteUsersBulk(callerRole, callerID, body.IDs); err != nil {
		respondServiceError(w, err)
		return
	}
	respondJSON(w, map[string]string{"message": "Users deleted"}, http.StatusOK)
}

// ─── Group handlers ───────────────────────────────────────────────────────────

func (h *Handler) ListGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := h.svc.ListGroups()
	if err != nil {
		respondError(w, "Failed to list groups", http.StatusInternalServerError)
		return
	}
	respondJSON(w, groups, http.StatusOK)
}

func (h *Handler) GetGroup(w http.ResponseWriter, r *http.Request) {
	id := pathID(r, "id")
	if id == 0 {
		respondError(w, "Invalid group ID", http.StatusBadRequest)
		return
	}
	g, err := h.svc.GetGroup(id)
	if err != nil {
		if errors.Is(err, ErrGroupNotFound) {
			respondError(w, "Group not found", http.StatusNotFound)
			return
		}
		respondError(w, "Database error", http.StatusInternalServerError)
		return
	}
	respondJSON(w, g, http.StatusOK)
}

func (h *Handler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	var req CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		respondError(w, "name is required", http.StatusBadRequest)
		return
	}

	callerRole := callerRoleFromContext(r.Context())
	g, err := h.svc.CreateGroup(callerRole, req)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	respondJSON(w, g, http.StatusCreated)
}

func (h *Handler) UpdateGroup(w http.ResponseWriter, r *http.Request) {
	id := pathID(r, "id")
	if id == 0 {
		respondError(w, "Invalid group ID", http.StatusBadRequest)
		return
	}
	var req UpdateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	callerID := callerIDFromContext(r.Context())
	callerRole := callerRoleFromContext(r.Context())

	g, err := h.svc.UpdateGroup(callerRole, callerID, id, req)
	if err != nil {
		respondServiceError(w, err)
		return
	}
	respondJSON(w, g, http.StatusOK)
}

func (h *Handler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	id := pathID(r, "id")
	if id == 0 {
		respondError(w, "Invalid group ID", http.StatusBadRequest)
		return
	}
	callerRole := callerRoleFromContext(r.Context())
	if err := h.svc.DeleteGroup(callerRole, id); err != nil {
		respondServiceError(w, err)
		return
	}
	respondJSON(w, map[string]string{"message": "Group deleted"}, http.StatusOK)
}

// ─── Roles reference ──────────────────────────────────────────────────────────

func (h *Handler) ListRoles(w http.ResponseWriter, r *http.Request) {
	type roleInfo struct {
		ID          RoleID       `json:"id"`
		Level       int          `json:"level"`
		Permissions []Permission `json:"permissions"`
	}
	result := make([]roleInfo, 0, len(AllRoles))
	for _, r := range AllRoles {
		result = append(result, roleInfo{
			ID:          r,
			Level:       RoleHierarchy[r],
			Permissions: RolePermissions[r],
		})
	}
	respondJSON(w, result, http.StatusOK)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func pathID(r *http.Request, key string) int {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars[key])
	return id
}

func respondJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, msg string, status int) {
	respondJSON(w, map[string]string{"error": msg}, status)
}

func respondServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrForbidden):
		respondError(w, err.Error(), http.StatusForbidden)
	case errors.Is(err, ErrEmailExists):
		respondError(w, err.Error(), http.StatusConflict)
	case errors.Is(err, ErrUserNotFound), errors.Is(err, ErrGroupNotFound):
		respondError(w, err.Error(), http.StatusNotFound)
	case errors.Is(err, ErrWeakPassword), errors.Is(err, ErrInvalidRole), errors.Is(err, ErrInvalidToken):
		respondError(w, err.Error(), http.StatusBadRequest)
	default:
		respondError(w, "Internal server error", http.StatusInternalServerError)
	}
}
