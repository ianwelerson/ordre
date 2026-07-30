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

describe('adapters/express/server', () => {
  it('responds 404 with a Not Found body for an unmatched route', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);

    expect(response.body).toEqual({ error: 'Not Found' });
  });

  it('responds 500 with a generic body when a handler throws', async () => {
    const response = await request(app).get('/api/boom').expect(500);

    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
