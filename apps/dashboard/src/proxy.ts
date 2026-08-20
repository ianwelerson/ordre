import { type NextRequest, NextResponse } from 'next/server';

import { DASHBOARD_ROUTES, SESSION_COOKIE_NAMES } from '@ordre/core/constants';
import { createServices } from '@ordre/services';

import { safeRedirect } from '@/shared/safeRedirect';

/**
 * The dashboard's route gate, run by Next before every matched request.
 *
 * It decides one thing: which shell a visitor lands in - the auth screens or
 * the app. It is deliberately *not* a security boundary: every piece of data
 * still crosses the API, which authenticates each request and enforces
 * row-level security. Nothing here needs to be right for the data to be safe;
 * it only needs to be right for the navigation to feel coherent.
 */

/**
 * Routes reachable without a session. Everything else requires one.
 *
 * Kept as a list because route groups - `(auth)` vs `(authenticated)` - emit no
 * URL segment, so there is nothing in the path for this to match on instead.
 */
const PUBLIC_ROUTES = [
  DASHBOARD_ROUTES.login,
  DASHBOARD_ROUTES.register,
  DASHBOARD_ROUTES.getStarted,
  DASHBOARD_ROUTES.inviteBase,
  DASHBOARD_ROUTES.forgotPassword,
  DASHBOARD_ROUTES.setPassword,
];

/**
 * How long the session check below may take before the visitor is treated as
 * signed out and handed the auth screens.
 *
 * The check sits in front of a navigation, so a hung API must not become a hung
 * page. Timing out into "no session" is the safe direction: the cost is an auth
 * screen offered to someone who did not need it, and signing in again simply
 * overwrites the cookie.
 */
const SESSION_CHECK_TIMEOUT_MS = 2_000;

/** Whether `pathname` is a public route, or nested under one (`/invite/:token`). */
const isPublic = (pathname: string) => {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
};

/**
 * Whether a session cookie is present - not whether it is valid.
 *
 * Optimistic on purpose: verifying would mean an API call on every navigation
 * and buy nothing, since the API re-checks each request anyway. Presence is
 * enough to pick a shell. The one branch where validity genuinely matters -
 * bouncing a visitor *away* from the auth screens - checks it for real with
 * `sessionIsValid`.
 */
const hasSessionCookie = (request: NextRequest) => {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
};

/**
 * Asks the API whether the session this request carries is still alive.
 *
 * Only ever called before the public-route bounce below - traffic to the auth
 * screens, which is rare - never on every navigation. The injected `fetch`
 * forwards the browser's cookie header, because a middleware-originated fetch
 * carries no cookies of its own, and caps the wait; everything else about the
 * call (base URL joining, response validation, error normalisation) is the same
 * `@ordre/services` surface the rest of the app uses.
 */
const sessionIsValid = async (request: NextRequest): Promise<boolean> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_URL) {
    return false;
  }

  const services = createServices({
    baseUrl: API_URL,
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal: AbortSignal.timeout(SESSION_CHECK_TIMEOUT_MS),
        headers: { ...init?.headers, cookie: request.headers.get('cookie') ?? '' },
      }),
  });

  try {
    const session = await services.auth.getSession();

    return session !== null;
  } catch {
    return false;
  }
};

/**
 * Where a confirmed session should land when it turns up on an auth screen.
 *
 * Back to whatever the login bounce stashed in `?next=`, so arriving at
 * `/login?next=/settings` with a session already in hand goes on to `/settings`
 * rather than dropping the destination at the door.
 *
 * `next` is re-checked against `isPublic` on top of `safeRedirect`, which only
 * proves the value is same-origin. A same-origin value pointing back at an auth
 * screen would arrive here again and bounce again, forever.
 */
const bounceTarget = (request: NextRequest): string => {
  const next = safeRedirect(request.nextUrl.searchParams.get('next'));

  return isPublic(new URL(next, request.url).pathname) ? '/' : next;
};

/**
 * Two redirects, and otherwise stays out of the way.
 *
 * No cookie on a protected path goes to the login screen, carrying the intended
 * destination - path and query - in `?next=`.
 *
 * A cookie on a public path goes on to that destination, but only once the
 * session is confirmed real. Bouncing on presence alone would trap a visitor
 * whose cookie has expired: the login screen would refuse them while every page
 * behind it 401s. A dead cookie falls through to the auth screens instead,
 * where signing in simply overwrites it.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = hasSessionCookie(request);

  if (!hasSession && !isPublic(pathname)) {
    const login = new URL(DASHBOARD_ROUTES.login, request.url);
    // So the user lands back where they were headed after signing in.
    login.searchParams.set('next', `${pathname}${request.nextUrl.search}`);

    return NextResponse.redirect(login);
  }

  if (hasSession && isPublic(pathname)) {
    const isSessionValid = await sessionIsValid(request);

    if (isSessionValid) {
      return NextResponse.redirect(new URL(bounceTarget(request), request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Limits the gate to page navigations: Next internals and anything with a file
 * extension are skipped. The `.*\.` alternative matches a dot *anywhere* in the
 * path, not just in a final segment - acceptable while this is a UX gate, but
 * worth remembering if a route ever legitimately carries one.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
