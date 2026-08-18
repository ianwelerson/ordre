import { API_BASE_PATH } from '@ordre/core/constants';
import { clientError, ServiceError } from '@ordre/core/errors';
import { ResponseErrorSchema, type z } from '@ordre/core/schemas';

export type HttpClientOptions = {
  /**
   * The API's origin - no path, no trailing slash (`https://api.ordre.app`).
   * The version prefix is joined on here, and the paths themselves come from
   * `API_ROUTES`, so a caller never spells either.
   */
  baseUrl: string;
  /** Injectable for tests and for server-side calls that forward cookies. */
  fetch?: typeof globalThis.fetch;
};

/**
 * Turns a raw response body into JSON, tolerating the empty ones.
 *
 * A non-JSON body means something between us and the API answered - a proxy 502
 * in HTML, say - so it surfaces as a transport failure rather than the
 * `SyntaxError` a bare `JSON.parse` would throw.
 */
const parseBody = (text: string, status: number): unknown => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw clientError('MALFORMED_RESPONSE', { status });
  }
};

export type HttpClient = ReturnType<typeof createHttpClient>;

export const createHttpClient = ({
  baseUrl,
  // Wrapped rather than captured: native `fetch` pulled off its global loses its
  // receiver, which browsers reject even though Node allows it.
  fetch = (...args) => globalThis.fetch(...args),
}: HttpClientOptions) => {
  const send = async (path: string, init: RequestInit): Promise<Response> => {
    try {
      return await fetch(`${baseUrl}${API_BASE_PATH}${path}`, init);
    } catch (error) {
      // Offline, DNS failure, blocked by CORS. Normalised so every caller only
      // ever has one error type to catch.
      // The underlying message ("Failed to fetch", a DNS error) is more useful to
      // a developer than the catalog's, so it is the one case worth overriding.
      // No status: nothing answered, so the catalog's nominal one stands.
      throw clientError('NETWORK_ERROR', {
        message: error instanceof Error ? error.message : undefined,
      });
    }
  };

  /**
   * `schema`, when given, is what makes the promised type true: the success
   * body is validated before it is returned, so API drift surfaces here as
   * `MALFORMED_RESPONSE` - the same code a non-JSON body raises, because it is
   * the same failure: the API answered with something it never sends. Without
   * it the body is passed through as claimed, unchecked.
   *
   * Error bodies are exempt: they carry the error envelope, not the resource,
   * and are parsed against `ResponseErrorSchema` below instead.
   */
  const request = async <T>(
    path: string,
    init: RequestInit = {},
    schema?: z.ZodType<T>
  ): Promise<T> => {
    const response = await send(path, {
      ...init,
      // Sessions are cookies and the API is a different origin: without this the
      // Set-Cookie is dropped and every later call is unauthenticated. It sits
      // after the spread so a caller can never turn it off.
      credentials: 'include',
      headers: {
        ...(init.body !== undefined && { 'content-type': 'application/json' }),
        ...init.headers,
      },
    });

    // Read as text first: the API sends bodiless 204s, and anything outside the
    // version prefix gets an empty 404 from the scanner gate. `.json()` on either
    // throws a SyntaxError that looks unrelated to the real mistake.
    const text = await response.text();
    const body = parseBody(text, response.status);

    if (!response.ok) {
      const parsed = ResponseErrorSchema.safeParse(body);

      throw parsed.success
        ? new ServiceError(
            parsed.data.code,
            parsed.data.message,
            response.status,
            parsed.data.details
          )
        : clientError('UNKNOWN_ERROR', { status: response.status });
    }

    if (!schema) {
      return body as T;
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      throw clientError('MALFORMED_RESPONSE', { status: response.status });
    }

    return parsed.data;
  };

  const withBody =
    (method: string) =>
    <T>(path: string, payload?: unknown, schema?: z.ZodType<T>) =>
      request<T>(
        path,
        {
          method,
          // `!== undefined` rather than a truthiness check, so a deliberate `false`
          // or `0` body still gets sent.
          body: payload !== undefined ? JSON.stringify(payload) : undefined,
        },
        schema
      );

  return {
    get: <T>(path: string, schema?: z.ZodType<T>) => request<T>(path, { method: 'GET' }, schema),
    delete: <T>(path: string, schema?: z.ZodType<T>) =>
      request<T>(path, { method: 'DELETE' }, schema),
    post: withBody('POST'),
    put: withBody('PUT'),
    patch: withBody('PATCH'),
  };
};
