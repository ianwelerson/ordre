/**
 * Every path the API serves, declared once.
 *
 * Unlike `routes.ts` - which holds the *pages* each frontend serves - these are
 * the transport contract, and they have three consumers that each need a
 * different spelling of the same path:
 *
 * - the Express router, which wants `:id`
 * - the OpenAPI document, which wants `{id}` (`toOpenApiPath`)
 * - the HTTP client, which wants a real value (`buildPath`)
 *
 * They live here rather than in `apps/api` because no layer inside the API may
 * import from another: the OpenAPI registrations sit in `controllers/` and the
 * routers in `adapters/express/`, and a controller reaching into the adapter
 * would break the direction the whole app is arranged around. `@ordre/core` is
 * the only module all three - plus `@ordre/services` - can legally import.
 *
 * Paths are absolute and version-free. `API_BASE_PATH` is joined on once, at the
 * two edges that own it: the Express mount in `server.ts` and the `servers` list
 * in the OpenAPI document.
 */

/**
 * The version prefix every API path hangs off. The API is already on its own
 * subdomain, so this segment buys versioning rather than namespacing - and it
 * doubles as the scanner gate in `server.ts`, which drops anything outside it
 * before the middleware stack runs.
 */
export const API_BASE_PATH = '/v1';

export const API_ROUTES = {
  health: '/health',

  /**
   * Better Auth owns everything under `base` and generates its own OpenAPI
   * fragment, so only the endpoints a client actually calls are listed - this is
   * not a complete map of its surface.
   */
  auth: {
    base: '/auth',
    signIn: '/auth/sign-in/email',
    signUp: '/auth/sign-up/email',
    signOut: '/auth/sign-out',
    session: '/auth/get-session',
    revokeSession: '/auth/revoke-session',
    requestPasswordReset: '/auth/request-password-reset',
    resetPassword: '/auth/reset-password',
  },

  workspace: {
    collection: '/workspace',
    byId: '/workspace/:id',
    bySlug: '/workspace/slug/:slug',
    slugExists: '/workspace/slug/:slug/exists',

    location: {
      collection: '/workspace/:id/location',
      byId: '/workspace/:id/location/:locationId',
      default: '/workspace/:id/location/:locationId/default',
      /** Assign / unassign a member to a location, keyed by both ids. */
      member: '/workspace/:id/location/:locationId/member/:memberId',
    },

    invite: {
      collection: '/workspace/:id/invite',
      byId: '/workspace/:id/invite/:inviteId',
    },

    member: {
      collection: '/workspace/:id/member',
      /** Self-service paths - literal, so they never collide with `:memberId`. */
      self: '/workspace/:id/member/me',
      leave: '/workspace/:id/member/leave',
      byId: '/workspace/:id/member/:memberId',
      role: '/workspace/:id/member/:memberId/role',
    },
  },

  /**
   * The invitee-facing invite flows. Deliberately *not* under `/workspace/:id`:
   * the invitee isn't a member yet and doesn't know the workspace id.
   */
  invite: {
    preview: '/invite/:token',
    accept: '/invite/:token/accept',
    decline: '/invite/:token/decline',
  },
} as const;

/** Rewrites `:param` to `{param}` for the OpenAPI document. */
export const toOpenApiPath = (path: string): string => path.replace(/:(\w+)/g, '{$1}');

/**
 * Fills `:param` placeholders with real values, for callers building a request.
 *
 * Throws on a missing param rather than emitting a URL with a literal `:id` in
 * it, which would otherwise reach the API as a 404 that looks like a bad id.
 *
 * @example
 *   buildPath(API_ROUTES.workspace.byId, { id }); // "/workspace/8f0e..."
 */
export const buildPath = (path: string, params: Record<string, string> = {}): string =>
  path.replace(/:(\w+)/g, (_match, key: string) => {
    const value = params[key];

    if (value === undefined) {
      throw new Error(`Missing route param "${key}" for "${path}"`);
    }

    return encodeURIComponent(value);
  });
