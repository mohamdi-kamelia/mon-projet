package users

import "time"

type RoleID string

const (
	RoleSuperAdmin    RoleID = "superadmin"
	RoleAdmin         RoleID = "admin"
	RoleGestionnaire  RoleID = "gestionnaire"
	RoleEditeur       RoleID = "editeur"
	RoleResponsableGT RoleID = "responsable_gt"
	RoleVisiteur      RoleID = "visiteur"
)

var RoleHierarchy = map[RoleID]int{
	RoleSuperAdmin:    100,
	RoleAdmin:         80,
	RoleGestionnaire:  60,
	RoleEditeur:       40,
	RoleResponsableGT: 30,
	RoleVisiteur:      10,
}

// AllRoles lists every valid role in descending priority order.
var AllRoles = []RoleID{
	RoleSuperAdmin,
	RoleAdmin,
	RoleGestionnaire,
	RoleEditeur,
	RoleResponsableGT,
	RoleVisiteur,
}

func (r RoleID) IsValid() bool {
	_, ok := RoleHierarchy[r]
	return ok
}

func (r RoleID) CanManage(target RoleID) bool {
	return RoleHierarchy[r] > RoleHierarchy[target]
}

type Permission string

const (
	PermManageUsers      Permission = "manage_users"
	PermManageRoles      Permission = "manage_roles"
	PermManageRolesLow   Permission = "manage_roles_low"
	PermManageRooms      Permission = "manage_rooms"
	PermInviteVisitor    Permission = "invite_visitor"
	PermEditMedia        Permission = "edit_media"
	PermEditDocs         Permission = "edit_docs"
	PermPublishDocs      Permission = "publish_docs"
	PermManageDocFilters Permission = "manage_doc_filters"
	PermPublishNews      Permission = "publish_news"   // publish news
	PermCreateGT         Permission = "create_gt"      // create working groups
	PermManageOwnGT      Permission = "manage_own_gt"  // manage own GT members/media
	PermManageAllGT      Permission = "manage_all_gt"  // manage any GT
	PermOrgConference    Permission = "org_conference" // organise a conference
	PermAnimConference   Permission = "anim_conference"
	PermConfigAmphi      Permission = "config_amphi"
	PermAccessGames      Permission = "access_games"
	PermManageGames      Permission = "manage_games"
	PermManageSiteLevel0 Permission = "manage_site_level0"
)

// RolePermissions maps each role to its allowed permissions.
var RolePermissions = map[RoleID][]Permission{
	RoleSuperAdmin: {
		PermManageUsers, PermManageRoles, PermManageRooms, PermInviteVisitor,
		PermEditMedia, PermEditDocs, PermPublishDocs, PermManageDocFilters,
		PermPublishNews, PermCreateGT, PermManageAllGT, PermOrgConference,
		PermAnimConference, PermConfigAmphi, PermAccessGames, PermManageGames,
		PermManageSiteLevel0,
	},
	RoleAdmin: {
		PermManageUsers, PermManageRoles, PermManageRooms, PermInviteVisitor,
		PermEditMedia, PermEditDocs, PermPublishDocs, PermManageDocFilters,
		PermPublishNews, PermCreateGT, PermManageAllGT, PermOrgConference,
		PermAnimConference, PermConfigAmphi, PermAccessGames, PermManageGames,
		PermManageSiteLevel0,
	},
	RoleGestionnaire: {
		PermManageRolesLow, PermManageRooms,
		PermEditMedia, PermCreateGT, PermManageAllGT, PermOrgConference,
		PermAnimConference, PermConfigAmphi, PermAccessGames,
	},
	RoleEditeur: {
		PermEditDocs, PermPublishDocs, PermManageDocFilters, PermPublishNews,
		PermAccessGames,
	},
	RoleResponsableGT: {
		PermEditMedia, PermManageOwnGT, PermOrgConference,
		PermAnimConference, PermAccessGames,
	},
	RoleVisiteur: {
		PermAccessGames,
	},
}

// HasPermission returns true if role r includes permission p.
func HasPermission(r RoleID, p Permission) bool {
	for _, perm := range RolePermissions[r] {
		if perm == p {
			return true
		}
	}
	return false
}

type User struct {
	ID           int        `json:"id"`
	Email        string     `json:"email"`
	Name         string     `json:"name"`
	PasswordHash string     `json:"-"`
	Role         RoleID     `json:"role"`
	AvatarConfig string     `json:"avatar_config,omitempty"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	LastLogin    *time.Time `json:"last_login,omitempty"`
}

type Group struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Role        RoleID    `json:"role"`
	CreatedAt   time.Time `json:"created_at"`
	Members     []int     `json:"members"` // user IDs
}

type CreateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Role     RoleID `json:"role"`
}

type UpdateUserRequest struct {
	Name     *string `json:"name"`
	Role     *RoleID `json:"role"`
	IsActive *bool   `json:"is_active"`
}

type CreateGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Role        RoleID `json:"role"`
	Members     []int  `json:"members"`
}

type UpdateGroupRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Role        *RoleID `json:"role"`
	Members     []int   `json:"members"`
}

type PaginatedUsers struct {
	Users      []User `json:"users"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
	TotalPages int    `json:"total_pages"`
}
