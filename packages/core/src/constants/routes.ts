/**
 * Client-side paths, split by the app that serves them.
 *
 * Paths only - never an origin. A route's shape (`/invite/:token`) is the same in
 * every environment, while the host it hangs off is not, so the two are declared
 * apart and joined at the edge that knows both (see `apps/api/src/config/urls.ts`).
 * Keeping origins out is also what lets this package stay importable from the
 * frontends, which have no `process.env` of ours to read.
 *
 * These are the source of truth for the apps' own routing as much as for the links
 * the API mails out: the point is that `/invite/${token}` is spelled once.
 */

/** Routes served by the operator dashboard (`dashboard.<domain>`). */
export const DASHBOARD_ROUTES = {
  login: '/login',
  invite: (token: string) => `/invite/${token}`,
} as const;

/** Routes served by the public marketing site (`<domain>`). */
export const MARKETING_ROUTES = {
  help: '/help',
  privacy: '/privacy',
} as const;
