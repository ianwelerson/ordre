import { app, BASE_PATH } from '#/adapters/express/server.ts';
import request from 'supertest';

/**
 * As we are using Better Auth, we can skip the tests for each route, as it's being tested by Better Auth team.
 * We are only checking the health route to make sure it's working fine.
 */

describe('Auth', () => {
  test(`GET ${BASE_PATH}/auth/ok`, async () => {
    const response = await request(app).get(`${BASE_PATH}/auth/ok`).send().expect(200);

    expect(response.body).toEqual({
      ok: true,
    });
  });
});
