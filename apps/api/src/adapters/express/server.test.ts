import { Router } from 'express';
import request from 'supertest';

// Replace the real router (which needs a DB) with a tiny one: a route that
// throws (to reach the error handler) and no catch-all (so unknown paths fall
// through to the 404 handler). Both live in server.ts, below this router.
vi.mock('./routes/index.ts', () => {
  const router = Router();

  router.get('/boom', () => {
    throw new Error('boom');
  });

  return { default: router };
});

// Keep the error handler's log out of the test output.
vi.mock('#/config/logger.ts', () => ({
  logger: { error: vi.fn() },
}));

const { app } = await import('./server.ts');
const { appOrigins, urls } = await import('#/config/urls.ts');
const { API_BASE_PATH } = await import('@ordre/core/constants');

const unknownUrl = `${API_BASE_PATH}/does-not-exist`;

describe('adapters/express/server', () => {
  describe('cors', () => {
    it('reflects a trusted origin and allows credentials', async () => {
      expect(appOrigins).toContain(urls.dashboard);

      const response = await request(app).get(unknownUrl).set('Origin', urls.dashboard);

      expect(response.headers['access-control-allow-origin']).toBe(urls.dashboard);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('does not echo an untrusted origin', async () => {
      const response = await request(app).get(unknownUrl).set('Origin', 'https://not-ours.example');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('non-API paths', () => {
    it('serves a robots.txt that disallows everything', async () => {
      const response = await request(app).get('/robots.txt').expect(200);

      expect(response.headers['content-type']).toMatch(/text\/plain/);
      expect(response.text).toBe('User-agent: *\nDisallow: /\n');
    });

    it.each(['/', '/.env', '/.well-known/mcp', '/v1foo'])(
      'rejects %s with an empty 404',
      async (path) => {
        const response = await request(app).get(path).expect(404);

        expect(response.text).toBe('');
      }
    );
  });

  it('responds 404 with a Not Found body for an unmatched route', async () => {
    const response = await request(app).get(unknownUrl).expect(404);

    expect(response.body).toEqual({ error: 'Not Found' });
  });

  it('responds 500 with a generic body when a handler throws', async () => {
    const response = await request(app).get(`${API_BASE_PATH}/boom`).expect(500);

    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
