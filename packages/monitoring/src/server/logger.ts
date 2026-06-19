import pino, { type Logger } from 'pino';

import { baseOptions } from './config.ts';

/**
 * General-purpose application logger - the replacement for `console.log`.
 * Pass a `service` so logs from each app/package are queryable by source.
 */
export const createLogger = (service?: string): Logger =>
  pino({ ...baseOptions, base: service ? { service } : undefined });
