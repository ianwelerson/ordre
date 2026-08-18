/**
 * Every absolute URL the API hands out, built in one place.
 *
 * This is the only module where an origin meets a path. Origins come from the
 * environment because they genuinely differ per deployment; paths come from
 * `@ordre/core/constants` because they never do. Splitting them that way is what
 * stopped `base_url` being a hardcoded production link in dev mail while
 * `invite_url` pointed at localhost in the same message.
 *
 * Values are resolved at import, not per call: `env` is already frozen by then, so
 * a getter would only hide the fact that these are constants of the process.
 *
 * Note this is deliberately *not* in `@ordre/core`: core is shared with the
 * frontends and has no business reading our `process.env`.
 */
import { env } from '#env';

import { DASHBOARD_ROUTES, MARKETING_ROUTES } from '@ordre/core/constants';

export const urls = {
  /** The API's own public origin. */
  api: env.BETTER_AUTH_URL,
  /** Public marketing site. */
  base: env.APP_BASE_URL,
  /** Operator dashboard root. */
  dashboard: env.APP_DASHBOARD_URL,
  /** Customer-facing board. */
  board: env.APP_BOARD_URL,
  /** Documentation site. */
  docs: env.APP_DOCS_URL,
  dashboardLogin: `${env.APP_DASHBOARD_URL}${DASHBOARD_ROUTES.login}`,
  help: `${env.APP_BASE_URL}${MARKETING_ROUTES.help}`,
  privacy: `${env.APP_BASE_URL}${MARKETING_ROUTES.privacy}`,

  /**
   * Where an invited member lands to accept. The dashboard, not the marketing
   * site: accepting creates a session, which only the dashboard can do.
   */
  invite: (token: string) => `${env.APP_DASHBOARD_URL}${DASHBOARD_ROUTES.invite(token)}`,
} as const;

/**
 * The browser origins allowed to call this API with credentials.
 *
 * One list, two consumers: CORS (which decides whether the browser hands the
 * response over) and Better Auth's `trustedOrigins` (which decides whether the
 * request is honoured at all). They have to agree, so they read the same array -
 * a request allowed by one and refused by the other fails in a way that looks
 * like neither.
 *
 * `urls.api` is deliberately absent: same-origin requests never trigger CORS,
 * and Better Auth already trusts its own `baseURL`.
 */
export const appOrigins: readonly string[] = [urls.base, urls.dashboard, urls.board, urls.docs];

/**
 * The domain the session cookie is scoped to, so every app on the umbrella can
 * read it - `ordre.app` in production, `ordre.localhost` in development.
 *
 * Derived from the *base* origin, not from `urls.api`: Better Auth would
 * otherwise default this to its own hostname (`api.ordre.app`), which is
 * host-only and invisible to the dashboard - the exact thing crossing subdomains
 * is meant to fix.
 *
 * No leading dot. RFC 6265 tells the browser to ignore one, and `Domain=ordre.app`
 * already matches every subdomain under it.
 */
export const cookieDomain: string = new URL(urls.base).hostname;

export default urls;
