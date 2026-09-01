const isDev = process.env.NODE_ENV !== 'production';

/**
 * Shared base options for every server-side logger (general + HTTP).
 *
 * - `pino-pretty` is only enabled in development. In production we emit raw
 *   JSON, which is faster and is what log platforms (Better Stack, Axiom,
 *   Sentry...) ingest. This also keeps `pino-pretty` a true devDependency.
 * - `redact` covers secrets logged as a plain object. Requests, responses and
 *   errors go through the serializers in `scrub.ts` instead, which reach the
 *   values a redact path cannot: an element of an array, or a substring of a
 *   message.
 */
export const baseOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
  ...(isDev ? { transport: { target: 'pino-pretty' } } : {}),
};
