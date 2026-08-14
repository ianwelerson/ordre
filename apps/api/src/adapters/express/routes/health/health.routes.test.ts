import { app } from '#/adapters/express/server.ts';
import request from 'supertest';
import z from 'zod';

import { API_BASE_PATH, API_ROUTES } from '@ordre/core/constants';

const healthUrl = `${API_BASE_PATH}${API_ROUTES.health}`;

describe('Health', () => {
  test(`GET ${healthUrl}`, async () => {
    const response = await request(app).get(healthUrl).send().expect(200);

    expect(response.body).toEqual({
      ok: true,
      timestamp: expect.schemaMatching(z.string()),
    });
  });
});
