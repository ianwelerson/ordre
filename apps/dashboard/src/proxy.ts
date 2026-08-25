import { type NextRequest, NextResponse } from 'next/server';

import { DASHBOARD_ROUTES, SESSION_COOKIE_NAMES } from '@ordre/core/constants';
import { createServices } from '@ordre/services';

import { safeRedirect } from '@/shared/safeRedirect';

/**
 * Decides which shell a visitor lands in, the auth screens or the app, and runs
 * before every matched request.
 *
 * This is not a security boundary. Every piece of data still crosses the API,
 * which authenticates each request and enforces row-level security, so this only
 * has to be right for the navigation to feel coherent.
 */

/**
 * Routes reachable without a session. Everything else requires one.
 *
 * This is a list rather than a path check because the `(auth)` and
 * `(authenticated)` route groups emit no URL segment to match on.
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
 * The longest the session check may take before the visitor is treated as signed
 * out.
 *
 * The check sits in front of a navigation, so a hung API must not become a hung
 * page. Timing out into "no session" costs at most an auth screen shown to
 * someone who did not need it, and signing in again overwrites the cookie.
 */
const SESSION_CHECK_TIMEOUT_MS = 2_000;

/**
 * Public routes a live session is still allowed to reach.
 *
 * The bounce below keeps a signed-in visitor off the sign-in screens, but an
 * invite page has to be reachable with a session, because only that page can
 * tell the visitor whether the invite was addressed to this account.
 */
const SESSION_TOLERANT_ROUTES = [DASHBOARD_ROUTES.inviteBase];

/** `pathname` is one of `routes`, or nested under one (`/invite/:token`). */
const matches = (pathname: string, routes: readonly string[]) => {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
};

const isPublic = (pathname: string) => {
  return matches(pathname, PUBLIC_ROUTES);
};

const allowsSession = (pathname: string) => {
  return matches(pathname, SESSION_TOLERANT_ROUTES);
};

/**
 * Returns whether a session cookie is present, not whether it is valid.
 *
 * Verifying on every navigation would cost an API call and buy nothing, since
 * the API re-checks each request anyway. The one branch where validity matters,
 * bouncing a visitor away from the auth screens, calls `sessionIsValid` instead.
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
 * Returns where a confirmed session should land when it arrives on an auth
 * screen, which is whatever the login bounce stashed in `?next=`.
 *
 * The value is checked against `isPublic` as well as `safeRedirect`, because
 * `safeRedirect` only proves it is same-origin and a same-origin value pointing
 * back at an auth screen would bounce here forever.
 */
const bounceTarget = (request: NextRequest): string => {
  const next = safeRedirect(request.nextUrl.searchParams.get('next'));
  const target = new URL(next, request.url).pathname;

  return isPublic(target) && !allowsSession(target) ? '/' : next;
};

/**
 * Applies the two redirects the gate exists for, and passes everything else
 * through.
 *
 * No cookie on a protected path goes to the login screen with the intended
 * destination in `?next=`. A cookie on a public path goes on to that
 * destination, but only once `sessionIsValid` confirms the session: bouncing on
 * presence alone would trap a visitor whose cookie has expired.
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

  if (hasSession && isPublic(pathname) && !allowsSession(pathname)) {
    const isSessionValid = await sessionIsValid(request);

    if (isSessionValid) {
      return NextResponse.redirect(new URL(bounceTarget(request), request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Limits the gate to page navigations, skipping Next internals and anything with
 * a file extension. The `.*\.` alternative matches a dot anywhere in the path
 * rather than only in the last segment, so a route carrying one would be skipped
 * too.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
