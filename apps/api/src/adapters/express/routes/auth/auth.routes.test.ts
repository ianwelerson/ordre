import { app } from '#/adapters/express/server.ts';
import request from 'supertest';

import { API_BASE_PATH, API_ROUTES } from '@ordre/core/constants';

/**
 * As we are using Better Auth, we can skip the tests for each route, as it's being tested by Better Auth team.
 * We are only checking the health route to make sure it's working fine.
 */

const authOkUrl = `${API_BASE_PATH}${API_ROUTES.auth.base}/ok`;

describe('Auth', () => {
  test(`GET ${authOkUrl}`, async () => {
    const response = await request(app).get(authOkUrl).send().expect(200);

    expect(response.body).toEqual({
      ok: true,
    });
  });
});
