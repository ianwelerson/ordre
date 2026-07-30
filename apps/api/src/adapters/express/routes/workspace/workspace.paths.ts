/**
 * Single source of truth for every workspace route path.
 *
 * Route paths are an HTTP/transport concern owned by this Express adapter layer -
 * the controllers stay transport-agnostic (they take a member + payload and
 * return a `Response`, never a URL). Both the routers and the route tests import
 * from here so a path is defined exactly once.
 */

// --- Workspace ---
export const workspaceBasePath = '/workspace';
export const workspaceCollectionPath = ''; // create + list
export const workspaceItemByIdPath = '/:id';
export const workspaceItemBySlugPath = '/slug/:slug';
export const workspaceSlugExistsPath = `${workspaceItemBySlugPath}/exists`;

// --- Workspace Location ---
// The location routes are a sub-router mounted at this path (under a workspace id).
export const workspaceLocationBasePath = `${workspaceItemByIdPath}/location`;
// Paths within the location sub-router, relative to the mount above.
export const locationCollectionPath = '/'; // create + list
export const locationItemPath = '/:locationId';
export const locationDefaultPath = `${locationItemPath}/default`;
// Assign / unassign a member to a location, keyed by both ids.
export const locationMemberPath = `${locationItemPath}/member/:memberId`;

// --- Workspace Invite (admin) ---
// The invite routes are a sub-router mounted at this path (under a workspace id).
export const workspaceInviteBasePath = `${workspaceItemByIdPath}/invite`;
// Paths within the invite sub-router, relative to the mount above.
export const inviteCollectionPath = '/'; // create + list
export const inviteItemPath = '/:inviteId';

// --- Workspace Member
export const workspaceMemberBasePath = `${workspaceItemByIdPath}/member`;
export const memberCollectionPath = '/'; // create + list
export const memberItemPath = '/:memberId';
export const memberRolePath = `${memberItemPath}/role`;
// Self-service paths - literal, so they never collide with `/:memberId`.
export const memberSelfPath = '/me';
export const memberLeavePath = '/leave';

// --- Public Invite (invitee-facing) ---
// These are the unauthenticated/session-only invite flows, keyed by the invite
// token. Unlike the admin paths above, they are NOT under `/workspace/:id` - the
// invitee isn't a member and doesn't know the workspace id, so the router is
// mounted at the app root (see routes/index.ts) and these paths are absolute.
export const invitePreviewPath = '/invite/:token';
export const inviteAcceptPath = '/invite/:token/accept';
export const inviteDeclinePath = '/invite/:token/decline';
