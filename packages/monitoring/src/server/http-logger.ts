import { pinoHttp } from 'pino-http';

import { baseOptions } from './config.ts';
import { scrubError, scrubRequest, scrubResponse } from './scrub.ts';

export type HttpLoggerOptions = {
  /** Set false to silence the access log entirely, as the test suite does. */
  enabled?: boolean;
  /** Paths logged at `debug` rather than `info`, for endpoints polled on a timer. */
  quietPaths?: string[];
};

/**
 * The path a URL addresses, without its query string or a trailing slash.
 * Express matches `/v1/health/` to the same route as `/v1/health`.
 */
const pathOf = (url: string): string => {
  const [path = ''] = url.split('?');

  return path.length > 1 ? path.replace(/\/+$/, '') : path;
};

/**
 * Express/HTTP request logger (automatic access logs).
 *
 * 404s drop to `debug` because a public host is scanned continuously for
 * `/wp-admin` and friends: at `info` that noise would drown out the log while
 * saying nothing about this service. They stay in the record - pino writes
 * every real log line; at `debug` they are one `LOG_LEVEL` flip away when a
 * genuine "why is this route missing?" question comes up.
 */
export const httpLogger = (service: string, options: HttpLoggerOptions = {}) => {
  const { enabled = true, quietPaths = [] } = options;

  return pinoHttp({
    ...baseOptions,
    enabled,
    base: { service },
    /**
     * `pino-http` composes a custom serializer over the standard one, so these
     * receive the already-serialized object - the opposite of `createLogger`.
     */
    serializers: { req: scrubRequest, res: scrubResponse, err: scrubError },
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) {
        return 'error';
      }

      if (res.statusCode === 404 || quietPaths.includes(pathOf(req.url ?? ''))) {
        return 'debug';
      }

      if (res.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
  });
};
