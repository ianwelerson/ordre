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
  /** Public marketing site. */
  base: env.APP_BASE_URL,
  /** Operator dashboard root. */
  dashboard: env.APP_DASHBOARD_URL,
  dashboardLogin: `${env.APP_DASHBOARD_URL}${DASHBOARD_ROUTES.login}`,
  help: `${env.APP_BASE_URL}${MARKETING_ROUTES.help}`,
  privacy: `${env.APP_BASE_URL}${MARKETING_ROUTES.privacy}`,

  /**
   * Where an invited member lands to accept. The dashboard, not the marketing
   * site: accepting creates a session, which only the dashboard can do.
   */
  invite: (token: string) => `${env.APP_DASHBOARD_URL}${DASHBOARD_ROUTES.invite(token)}`,
} as const;

export default urls;
