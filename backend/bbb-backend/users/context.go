package users

import "context"

type contextKey string

const (
	contextKeyCallerID   contextKey = "caller_id"
	contextKeyCallerRole contextKey = "caller_role"
)

func contextWithCaller(ctx context.Context, id int, role RoleID) context.Context {
	ctx = context.WithValue(ctx, contextKeyCallerID, id)
	ctx = context.WithValue(ctx, contextKeyCallerRole, role)
	return ctx
}

func callerIDFromContext(ctx context.Context) int {
	v, _ := ctx.Value(contextKeyCallerID).(int)
	return v
}

func callerRoleFromContext(ctx context.Context) RoleID {
	v, _ := ctx.Value(contextKeyCallerRole).(RoleID)
	return v
}
