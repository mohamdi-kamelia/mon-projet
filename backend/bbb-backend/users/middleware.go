package users

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// RequireAuth validates the JWT and injects user_id into the request context.
// It also fetches and injects the caller's role so downstream handlers can
// do permission checks without extra DB calls.
func (s *Service) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
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

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return s.jwtSecret, nil
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
		rawID, ok := claims["user_id"].(float64)
		if !ok {
			respondError(w, "Invalid user_id in token", http.StatusUnauthorized)
			return
		}

		callerID := int(rawID)
		role, err := s.repo.GetUserRole(callerID)
		if err != nil {
			if err == sql.ErrNoRows {
				respondError(w, "User not found", http.StatusUnauthorized)
				return
			}
			respondError(w, "Database error", http.StatusInternalServerError)
			return
		}

		ctx := contextWithCaller(r.Context(), callerID, role)
		next(w, r.WithContext(ctx))
	}
}

// RequirePermission wraps RequireAuth and additionally asserts that the caller
// holds the given permission. Use this for fine-grained route protection.
func (s *Service) RequirePermission(perm Permission, next http.HandlerFunc) http.HandlerFunc {
	return s.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		role := callerRoleFromContext(r.Context())
		if !HasPermission(role, perm) {
			respondError(w, "Forbidden: insufficient permissions", http.StatusForbidden)
			return
		}
		next(w, r)
	})
}

// RequireRole wraps RequireAuth and ensures the caller has at least one of the
// given roles.
func (s *Service) RequireRole(roles []RoleID, next http.HandlerFunc) http.HandlerFunc {
	return s.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		callerRole := callerRoleFromContext(r.Context())
		for _, allowed := range roles {
			if callerRole == allowed {
				next(w, r)
				return
			}
		}
		respondError(w, "Forbidden: role not allowed", http.StatusForbidden)
	})
}
