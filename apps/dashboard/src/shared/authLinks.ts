import { DASHBOARD_ROUTES } from '@ordre/core/constants';

import { LOGIN_NOTICE_PARAM, type LoginNotice } from './constants';

/** The query param the auth screens carry a destination in. */
const NEXT_PARAM = 'next';

/**
 * Builds a login URL that returns the visitor to `next` once signed in.
 * `safeRedirect` is the read side of this pair: it narrows the value back down
 * to a path the app will follow.
 *
 * @param next - Where to land once signed in.
 * @param notice - A banner for the login screen, explaining why they are here.
 * @example
 * loginRedirect(DASHBOARD_ROUTES.invite(token), LOGIN_NOTICE.accountExists);
 */
export const loginRedirect = (next: string, notice?: LoginNotice): string => {
  const params = new URLSearchParams({ [NEXT_PARAM]: next });

  if (notice) {
    params.set(LOGIN_NOTICE_PARAM, notice);
  }

  return `${DASHBOARD_ROUTES.login}?${params}`;
};

/**
 * Carries the current destination onto another auth screen, so stepping sideways
 * between them does not drop where the visitor was headed.
 *
 * @param path - The screen being linked to.
 * @param next - The current `next` param, or `null` when there is none.
 * @example
 * withNext(DASHBOARD_ROUTES.register, searchParams.get('next'));
 */
export const withNext = (path: string, next: string | null): string => {
  return next ? `${path}?${new URLSearchParams({ [NEXT_PARAM]: next })}` : path;
};
