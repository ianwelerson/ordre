/**
 * The session cookie, named once for the two sides that have to agree on it: the
 * API configures Better Auth with the prefix, and the dashboard's proxy reads
 * the cookie back to decide whether to show a login screen.
 *
 * The API could ask Better Auth itself (`auth.$context.authCookies`), but the
 * dashboard cannot - it has no auth instance - so the value lives here rather
 * than being spelled twice.
 */

/**
 * Passed to Better Auth as `advanced.cookiePrefix`. It is a *prefix*, not the
 * cookie name: Better Auth appends the cookie's own name to it.
 */
export const SESSION_COOKIE_PREFIX = 'ordre-app';

/** What Better Auth calls the session cookie, before any prefixing. */
const SESSION_TOKEN = 'session_token';

/**
 * Every name the session cookie can arrive under, most specific first.
 *
 * Better Auth prepends `__Secure-` whenever it issues secure cookies, which it
 * does automatically when its `baseURL` is https - so the name differs between a
 * plain-http stage and every other one. A reader checks both rather than
 * assuming, exactly as Better Auth's own `getSessionCookie` helper does.
 */
export const SESSION_COOKIE_NAMES = [
  `__Secure-${SESSION_COOKIE_PREFIX}.${SESSION_TOKEN}`,
  `${SESSION_COOKIE_PREFIX}.${SESSION_TOKEN}`,
] as const;
