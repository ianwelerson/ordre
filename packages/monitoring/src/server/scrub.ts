/**
 * Serializer helpers that keep credentials and personal data out of every log
 * record, shared by the application logger and the HTTP access log.
 */

const REDACTED = '[redacted]';

/**
 * Request headers kept in the access log.
 *
 * An allowlist rather than a denylist, so a header added to the stack later is
 * dropped by default instead of being logged until somebody notices.
 */
const KEPT_HEADERS = [
  'host',
  'user-agent',
  'referer',
  'accept-language',
  'content-type',
  'content-length',
];

/**
 * Kept headers whose value is a URL, so it is masked the same way `req.url` is.
 * `referer` carries the dashboard's `/invite/:token` and `?token=` screens.
 */
const URL_HEADERS = new Set(['referer']);

/** Query parameter names whose value survives masking. Empty: no route reads one. */
const KEPT_QUERY = new Set<string>([]);

/**
 * Path segments whose following segment is a credential: the invite token in
 * `/v1/invite/:token` and the reset token in `/v1/auth/reset-password/:token`.
 * Matching on the segment name also masks the invite id in
 * `/v1/workspace/:id/invite/:inviteId`, which is not a secret.
 */
const SECRET_BEARING_SEGMENTS = new Set(['invite', 'reset-password']);

/**
 * Error properties holding the values a statement ran with. `params` is
 * Drizzle's bound-parameter array; the rest are node-postgres fields that quote
 * the offending row back.
 */
const VALUE_BEARING_KEYS = ['params', 'detail', 'where', 'internalQuery'];

/**
 * Replaces the segment following each credential-bearing prefix.
 * `/v1/invite/:token` becomes `/v1/invite/[redacted]`.
 */
const maskPath = (path: string): string => {
  const segments = path.split('/');

  return segments
    .map((segment, index) => {
      const previous = segments[index - 1];

      return segment && previous && SECRET_BEARING_SEGMENTS.has(previous) ? REDACTED : segment;
    })
    .join('/');
};

/**
 * Keeps a query string's parameter names and replaces every value outside
 * {@link KEPT_QUERY}, since anything this API is sent is a token or a redirect
 * target belonging to Better Auth.
 */
const maskQuery = (query: string): string =>
  [...new URLSearchParams(query)]
    .map(([key, value]) => `${key}=${KEPT_QUERY.has(key) ? value : REDACTED}`)
    .join('&');

/** Masks the credentials the invite and auth flows carry in a URL. */
export const maskUrl = (url: string): string => {
  const [path = '', query] = url.split('?');

  return query ? `${maskPath(path)}?${maskQuery(query)}` : maskPath(path);
};

/** The shape `pino-std-serializers` produces for a request. */
type SerializedRequest = {
  id?: unknown;
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
};

const pickHeaders = (headers: Record<string, unknown> = {}): Record<string, unknown> =>
  Object.fromEntries(
    KEPT_HEADERS.filter((name) => name in headers).map((name) => {
      const value = headers[name];

      return [name, URL_HEADERS.has(name) && typeof value === 'string' ? maskUrl(value) : value];
    })
  );

/**
 * Rebuilds a serialized request from the fields worth keeping.
 *
 * Constructed fresh rather than edited, so `query`, `params`, `remoteAddress`
 * and `remotePort` are gone by omission: the first two restate the URL without
 * its masking, and the last two are the caller's address.
 */
export const scrubRequest = (req: SerializedRequest) => ({
  id: req.id,
  method: req.method,
  url: typeof req.url === 'string' ? maskUrl(req.url) : req.url,
  headers: pickHeaders(req.headers),
});

/**
 * Keeps a response's status and drops its headers, which carry the session
 * cookie Better Auth writes on every sign-in and sign-up.
 */
export const scrubResponse = (res: { statusCode?: number | null }) => ({
  statusCode: res.statusCode,
});

/** The shape `pino-std-serializers` produces for an error, plus what Drizzle and pg add. */
type SerializedError = Record<string, unknown>;

/** Replaces every occurrence of `found`, leaving a non-string untouched. */
const cut = (text: unknown, found: string, replacement: string): unknown => {
  return typeof text === 'string' ? text.split(found).join(replacement) : text;
};

/**
 * Removes the values a failed statement ran with from a serialized error.
 *
 * `DrizzleQueryError` renders its bound parameters into its own message, which
 * pino then carries into `message` and `stack`, so the exact string its
 * constructor built is rebuilt here and cut out of both. The parameterised SQL
 * stays: it names columns, never values.
 */
export const scrubError = (err: SerializedError): SerializedError => {
  const scrubbed: SerializedError = { ...err };
  const { query, params, aggregateErrors } = scrubbed;

  if (typeof query === 'string' && Array.isArray(params)) {
    const rendered = `Failed query: ${query}\nparams: ${String(params)}`;
    const safe = `Failed query: ${query}`;

    scrubbed.message = cut(scrubbed.message, rendered, safe);
    scrubbed.stack = cut(scrubbed.stack, rendered, safe);
  }

  /**
   * `pino-std-serializers` serializes an `AggregateError`'s members, and any
   * error-like property other than `cause`, before this runs, so each one is
   * scrubbed here or it keeps the values its own statement ran with.
   */
  if (Array.isArray(aggregateErrors)) {
    scrubbed.aggregateErrors = aggregateErrors.map((nested) =>
      nested && typeof nested === 'object' ? scrubError(nested as SerializedError) : nested
    );
  }

  for (const key of VALUE_BEARING_KEYS) {
    delete scrubbed[key];
  }

  return scrubbed;
};
