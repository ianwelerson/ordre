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

const DASHBOARD_INVITE_BASE = '/invite';

/** Routes served by the operator dashboard (`dashboard.<domain>`). */
export const DASHBOARD_ROUTES = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  setPassword: '/set-password',
  getStarted: '/get-started',
  inviteBase: DASHBOARD_INVITE_BASE,
  invite: (token: string) => `${DASHBOARD_INVITE_BASE}/${token}`,
} as const;

/**
 * The set-password screen serves two arrivals - a password reset and an invite's
 * first password - and the link says which. Declared beside the routes because
 * the API mails the link and the dashboard reads the param back off it.
 */
export const SET_PASSWORD_SOURCE_PARAM = 'source';

export const SET_PASSWORD_SOURCE = {
  forgotPassword: 'forgot-password',
  createPassword: 'create-password',
} as const;

export type SetPasswordSource = (typeof SET_PASSWORD_SOURCE)[keyof typeof SET_PASSWORD_SOURCE];

/** Routes served by the public marketing site (`<domain>`). */
export const MARKETING_ROUTES = {
  help: '/help',
  privacy: '/privacy',
  terms: '/terms',
} as const;
