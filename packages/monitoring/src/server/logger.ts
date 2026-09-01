import pino, { type Logger, type LoggerOptions, stdSerializers } from 'pino';

import { baseOptions } from './config.ts';
import { scrubError } from './scrub.ts';

/**
 * General-purpose application logger - the replacement for `console.log`.
 * Pass a `service` so logs from each app/package are queryable by source.
 */
export const createLogger = (service?: string, options: LoggerOptions = {}): Logger =>
  pino({
    ...baseOptions,
    base: service ? { service } : undefined,
    ...options,
    /**
     * Spread last, and `err` after the caller's own serializers, so scrubbing is
     * not something a `serializers` option can switch off. Composed by hand
     * because a custom `err` serializer on a plain pino instance receives the
     * raw `Error`, while `pino-http` hands its serializers the already-
     * serialized object.
     */
    serializers: {
      ...options.serializers,
      err: (error: Error) => scrubError(stdSerializers.err(error)),
    },
  });
