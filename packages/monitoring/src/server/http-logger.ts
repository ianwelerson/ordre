import { pinoHttp } from 'pino-http';

import { baseOptions } from './config.ts';

/**
 * Express/HTTP request logger (automatic access logs).
 * Shares redaction + dev/prod formatting with `createLogger`.
 *
 * 404s are demoted to `debug` because a public host is probed continuously by
 * scanners looking for `/.env`, `/wp-login.php` and friends. At `info` they bury
 * every real log line; at `debug` they are one `LOG_LEVEL` flip away when a
 * genuine "why is this route missing?" question comes up.
 */
export const httpLogger = (service: string, enabled: boolean = true) =>
  pinoHttp({
    ...baseOptions,
    enabled,
    base: { service },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) {
        return 'error';
      }

      if (res.statusCode === 404) {
        return 'debug';
      }

      if (res.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
  });
