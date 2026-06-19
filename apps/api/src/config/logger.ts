import { createLogger, type Logger } from '@ordre/monitoring/server';

/**
 * The single application logger for the API. Import this everywhere instead of
 * calling `createLogger` again - that would spin up a separate pino instance.
 *
 * For per-module context, derive a child: `logger.child({ controller: 'auth' })`.
 */
export const logger: Logger = createLogger('api');
