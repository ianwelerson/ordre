import { app } from '#/adapters/express/server.ts';
import { setFeature } from '#/test/db.ts';
import { ownerDb } from '#/test/owner-db.ts';
import { eq } from 'drizzle-orm';
import request from 'supertest';

import { API_BASE_PATH } from '@ordre/core/constants';
import * as schema from '@ordre/db/schemas';

/**
 * Spellings of the auth paths that must all end up refused while the switch is off.
 *
 * `guardAuthFeature` matches `ctx.path` exactly, which covers every request only
 * while Better Auth's router is as strict about what reaches a handler. These
 * cases pin that coupling, so a router that starts tolerating a trailing slash or
 * a different case fails here rather than serving a surface reported as closed.
 */
const SPELLINGS = (verb: 'sign-up' | 'sign-in') => [
  `/auth/${verb}/email`,
  `/auth/${verb}/email/`,
  `/auth/${verb}/email//`,
  `/auth/${verb.toUpperCase()}/EMAIL`,
  `/auth//${verb}/email`,
  `/auth/./${verb}/email`,
  `/auth/x/../${verb}/email`,
  `/auth/${verb}/email%2f`,
  `/auth/${verb}%2Femail`,
  `/auth/${verb}/email?next=1`,
  `/auth/${verb}/email;a=b`,
  `/auth/${verb}/email%00`,
  `/auth/${verb}/email.`,
  `/auth/${verb}/email%20`,
];

describe('Auth feature switches', () => {
  describe('registration', () => {
    test('no spelling of the sign-up path creates an account while the switch is off', async () => {
      await setFeature('registration', false);

      const reached: string[] = [];

      for (const [index, path] of SPELLINGS('sign-up').entries()) {
        const email = `probe-${index}@ordre.app`;

        await request(app).post(`${API_BASE_PATH}${path}`).send({
          email,
          password: 'a-long-enough-password',
          firstName: 'Probe',
          lastName: 'User',
          name: 'Probe User',
        });

        const rows = await ownerDb
          .select({ id: schema.user.id })
          .from(schema.user)
          .where(eq(schema.user.email, email));

        if (rows.length > 0) {
          reached.push(path);
        }
      }

      // Collected by name, so a failure says which spelling got through.
      expect(reached).toEqual([]);
    });
  });

  describe('login', () => {
    test('no spelling of the sign-in path issues a session while the switch is off', async () => {
      await setFeature('login', false);

      const reached: string[] = [];

      for (const path of SPELLINGS('sign-in')) {
        const response = await request(app)
          .post(`${API_BASE_PATH}${path}`)
          .send({ email: 'owner@ordre.app', password: 'a-long-enough-password' });

        if (response.headers['set-cookie']) {
          reached.push(path);
        }
      }

      expect(reached).toEqual([]);
    });
  });
});
