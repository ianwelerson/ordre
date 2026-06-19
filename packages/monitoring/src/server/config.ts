const isDev = process.env.NODE_ENV !== 'production';

/**
 * Shared base options for every server-side logger (general + HTTP).
 *
 * - `pino-pretty` is only enabled in development. In production we emit raw
 *   JSON, which is faster and is what log platforms (Better Stack, Axiom,
 *   Sentry...) ingest. This also keeps `pino-pretty` a true devDependency.
 * - `redact` strips common secrets from any logged object.
 */
export const baseOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
  ...(isDev ? { transport: { target: 'pino-pretty' } } : {}),
};
