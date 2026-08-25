import { DASHBOARD_ROUTES } from '@ordre/core/constants';

import { LOGIN_NOTICE_PARAM, type LoginNotice } from './constants';

/** The query param the auth screens carry a destination in. */
const NEXT_PARAM = 'next';

/**
 * The login URL that comes back here afterwards.
 *
 * `safeRedirect` is the read side of this - it narrows the `next` this produces
 * back down to a path the app will honour - so the two belong together.
 *
 * @param next - Where to land once signed in.
 * @param notice - A banner for the login screen to explain the trip.
 */
export const loginRedirect = (next: string, notice?: LoginNotice): string => {
  const params = new URLSearchParams({ [NEXT_PARAM]: next });

  if (notice) {
    params.set(LOGIN_NOTICE_PARAM, notice);
  }

  return `${DASHBOARD_ROUTES.login}?${params}`;
};

/**
 * Carries the destination a visitor arrived with onto another auth screen, so
 * stepping sideways between them does not drop where they were headed.
 *
 * @param path - The screen being linked to.
 * @param next - The current `next` param, or `null` when there is none.
 */
export const withNext = (path: string, next: string | null): string => {
  return next ? `${path}?${new URLSearchParams({ [NEXT_PARAM]: next })}` : path;
};
