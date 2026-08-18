import { failingFetch, jsonResponse, stubFetch } from '#/test/fetch.ts';

import { API_BASE_PATH } from '@ordre/core/constants';
import { CLIENT_ERRORS, ServiceError } from '@ordre/core/errors';
import { z } from '@ordre/core/schemas';

import { createHttpClient } from './client.ts';

const BASE_URL = 'https://api.ordre.localhost';

describe('createHttpClient', () => {
  describe('request shape', () => {
    it('joins the origin, the version prefix, and the path', async () => {
      const { fetch, calls } = stubFetch(jsonResponse({ ok: true }));

      await createHttpClient({ baseUrl: BASE_URL, fetch }).get('/workspace');

      expect(calls[0]?.url).toBe(`${BASE_URL}${API_BASE_PATH}/workspace`);
    });

    it('sends cookies on every request', async () => {
      const { fetch, calls } = stubFetch(jsonResponse({ ok: true }));

      await createHttpClient({ baseUrl: BASE_URL, fetch }).get('/workspace');

      expect(calls[0]?.init.credentials).toBe('include');
    });

    it('claims a JSON content type only when a body is actually sent', async () => {
      const { fetch, calls } = stubFetch(jsonResponse({ ok: true }));
      const http = createHttpClient({ baseUrl: BASE_URL, fetch });

      await http.get('/workspace');
      await http.post('/workspace');
      await http.post('/workspace', { name: 'Ordre' });

      expect(calls[0]?.init.headers).toEqual({});
      expect(calls[1]?.init.headers).toEqual({});
      expect(calls[2]?.init.headers).toEqual({ 'content-type': 'application/json' });
    });

    it('serialises the payload on the verbs that carry one', async () => {
      const { fetch, calls } = stubFetch(jsonResponse({ ok: true }));
      const http = createHttpClient({ baseUrl: BASE_URL, fetch });

      await http.post('/workspace', { name: 'Ordre' });
      await http.put('/workspace/1', { name: 'Ordre' });
      await http.patch('/workspace/1', { name: 'Ordre' });

      expect(calls.map((call) => call.init.method)).toEqual(['POST', 'PUT', 'PATCH']);
      expect(calls.every((call) => call.init.body === '{"name":"Ordre"}')).toBe(true);
    });

    it('omits the body when no payload is given, but keeps a falsy one', async () => {
      const { fetch, calls } = stubFetch(jsonResponse({ ok: true }));
      const http = createHttpClient({ baseUrl: BASE_URL, fetch });

      await http.post('/workspace');
      await http.post('/workspace', false);

      expect(calls[0]?.init.body).toBeUndefined();
      expect(calls[1]?.init.body).toBe('false');
    });
  });

  describe('responses', () => {
    it('returns the parsed body on success', async () => {
      const { fetch } = stubFetch(jsonResponse({ id: 'ws_1', name: 'Ordre' }));

      const workspace = await createHttpClient({ baseUrl: BASE_URL, fetch }).get<{ id: string }>(
        '/workspace'
      );

      expect(workspace).toEqual({ id: 'ws_1', name: 'Ordre' });
    });

    it('returns null for a bodiless 204', async () => {
      const { fetch } = stubFetch(new Response(null, { status: 204 }));

      const result = await createHttpClient({ baseUrl: BASE_URL, fetch }).delete('/invite/abc');

      expect(result).toBeNull();
    });
  });

  describe('response validation', () => {
    const WorkspaceSchema = z.object({ id: z.string(), name: z.string() });

    it('returns the parsed value when the body matches the schema', async () => {
      const { fetch } = stubFetch(jsonResponse({ id: 'ws_1', name: 'Ordre' }));

      const workspace = await createHttpClient({ baseUrl: BASE_URL, fetch }).get(
        '/workspace',
        WorkspaceSchema
      );

      expect(workspace).toEqual({ id: 'ws_1', name: 'Ordre' });
    });

    it('validates on the payload verbs too', async () => {
      const { fetch } = stubFetch(jsonResponse({ id: 'ws_1', name: 'Ordre' }));

      const workspace = await createHttpClient({ baseUrl: BASE_URL, fetch }).post(
        '/workspace',
        { name: 'Ordre' },
        WorkspaceSchema
      );

      expect(workspace).toEqual({ id: 'ws_1', name: 'Ordre' });
    });

    it('raises MALFORMED_RESPONSE when a success body does not match the schema', async () => {
      const { fetch } = stubFetch(jsonResponse({ something: 'else' }));

      const error = await createHttpClient({ baseUrl: BASE_URL, fetch })
        .get('/workspace', WorkspaceSchema)
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toMatchObject({ code: 'MALFORMED_RESPONSE', status: 200 });
    });

    it('leaves the body unchecked when no schema is given', async () => {
      const { fetch } = stubFetch(jsonResponse({ anything: 'goes' }));

      const result = await createHttpClient({ baseUrl: BASE_URL, fetch }).get('/workspace');

      expect(result).toEqual({ anything: 'goes' });
    });

    it('never validates an error body against the schema', async () => {
      // A failure body carries the error envelope, not the resource: the real
      // API error must surface, not MALFORMED_RESPONSE.
      const { fetch } = stubFetch(jsonResponse({ code: 'FORBIDDEN', message: 'Forbidden' }, 403));

      const error = await createHttpClient({ baseUrl: BASE_URL, fetch })
        .get('/workspace', WorkspaceSchema)
        .catch((thrown: unknown) => thrown);

      expect(error).toMatchObject({ code: 'FORBIDDEN', status: 403 });
    });
  });

  describe('failures', () => {
    it('turns the API error envelope into a ServiceError', async () => {
      const { fetch } = stubFetch(
        jsonResponse(
          {
            code: 'INVALID_INPUT',
            message: 'Validation error',
            details: { email: 'Invalid email' },
          },
          400
        )
      );

      const error = await createHttpClient({ baseUrl: BASE_URL, fetch })
        .post('/auth/sign-in/email', {})
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toMatchObject({
        code: 'INVALID_INPUT',
        message: 'Validation error',
        status: 400,
        details: { email: 'Invalid email' },
      });
    });

    it('raises a ServiceError, not a SyntaxError, on an empty-bodied 404', async () => {
      const { fetch } = stubFetch(new Response('', { status: 404 }));

      const error = await createHttpClient({ baseUrl: BASE_URL, fetch })
        .get('/workspace')
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toMatchObject({ code: 'UNKNOWN_ERROR', status: 404 });
    });

    it('raises MALFORMED_RESPONSE when the body is not JSON at all', async () => {
      const { fetch } = stubFetch(new Response('<html>502 Bad Gateway</html>', { status: 502 }));

      const error = await createHttpClient({ baseUrl: BASE_URL, fetch })
        .get('/workspace')
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toMatchObject({ code: 'MALFORMED_RESPONSE', status: 502 });
    });

    it('falls back to UNKNOWN_ERROR when the error body is an unrecognised shape', async () => {
      const { fetch } = stubFetch(jsonResponse({ something: 'else' }, 500));

      const error = await createHttpClient({ baseUrl: BASE_URL, fetch })
        .get('/workspace')
        .catch((thrown: unknown) => thrown);

      expect(error).toMatchObject({ code: 'UNKNOWN_ERROR', status: 500 });
    });

    it('normalises a network failure into a ServiceError', async () => {
      const fetch = failingFetch(new TypeError('Failed to fetch'));

      const error = await createHttpClient({ baseUrl: BASE_URL, fetch })
        .get('/workspace')
        .catch((thrown: unknown) => thrown);

      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'Failed to fetch',
        status: CLIENT_ERRORS.NETWORK_ERROR.status,
      });
    });
  });
});
