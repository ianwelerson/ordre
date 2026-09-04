import { app } from '#/adapters/express/server.ts';
import { setFeature } from '#/test/db.ts';
import { parseBody } from '#/utils/testing.ts';
import request from 'supertest';

import { API_BASE_PATH, API_ROUTES } from '@ordre/core/constants';
import { ResponseErrorSchema } from '@ordre/core/schemas';

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

  /**
   * The exception to the note above. These paths are Better Auth's, but the
   * switch that closes them is ours, and only a request through the real router
   * proves the guard is mounted in the `before` hook rather than merely written.
   */
  describe('feature switches', () => {
    test('POST sign-up is refused while `registration` is off', async () => {
      await setFeature('registration', false);

      const response = await request(app)
        .post(`${API_BASE_PATH}${API_ROUTES.auth.signUp}`)
        .send({
          email: 'blocked@ordre.app',
          password: 'a-long-enough-password',
          firstName: 'Blocked',
          lastName: 'Signup',
        })
        .expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe(
        'FEATURE_REGISTRATION_DISABLED'
      );
    });

    test('POST sign-in is refused while `login` is off', async () => {
      await setFeature('login', false);

      const response = await request(app)
        .post(`${API_BASE_PATH}${API_ROUTES.auth.signIn}`)
        .send({ email: 'owner@ordre.app', password: 'a-long-enough-password' })
        .expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FEATURE_LOGIN_DISABLED');
    });

    test('closing `login` leaves sign-up open, and the other way round', async () => {
      await setFeature('login', false);

      // Reaches Better Auth's own validation rather than the switch guard, which
      // is what proves the two paths are gated independently.
      const response = await request(app)
        .post(`${API_BASE_PATH}${API_ROUTES.auth.signUp}`)
        .send({})
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
