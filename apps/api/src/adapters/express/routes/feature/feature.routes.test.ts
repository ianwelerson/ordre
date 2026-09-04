import { app } from '#/adapters/express/server.ts';
import { db } from '#/config/db.ts';
import { setFeature } from '#/test/db.ts';
import { parseBody } from '#/utils/testing.ts';
import { sql } from 'drizzle-orm';
import request from 'supertest';

import { API_BASE_PATH, API_ROUTES } from '@ordre/core/constants';
import { FEATURES } from '@ordre/core/enums';
import { FeaturesSchema } from '@ordre/core/schemas';

const URL = `${API_BASE_PATH}${API_ROUTES.features}`;

describe('Feature', () => {
  describe(API_ROUTES.features, () => {
    test('GET answers without a session, since the sign-up screen reads it first', async () => {
      const response = await request(app).get(URL).send().expect(200);

      expect(parseBody(FeaturesSchema, response.body)).toBeDefined();
    });

    test('GET carries one boolean for every declared feature', async () => {
      const response = await request(app).get(URL).send().expect(200);

      const features = parseBody(FeaturesSchema, response.body);

      expect(Object.keys(features).sort()).toEqual([...FEATURES].sort());
      expect(Object.values(features).every((value) => typeof value === 'boolean')).toBe(true);
    });

    test('GET reports a switch that has been closed', async () => {
      await setFeature('registration', false);

      const response = await request(app).get(URL).send().expect(200);

      const features = parseBody(FeaturesSchema, response.body);

      expect(features.registration).toBe(false);
      // Closing one switch leaves the rest alone.
      expect(features['workspace-creation']).toBe(true);
    });

    test('GET carries only the switches, never operational state', async () => {
      const response = await request(app).get(URL).send();

      // The response is a public, unauthenticated disclosure surface, so the key
      // set is the whole contract: anything else here would be leaking.
      expect(Object.keys(response.body).sort()).toEqual([...FEATURES].sort());
    });
  });

  /**
   * The privileges the runtime role holds on the `feature` table, granted in
   * `0004_pale_doctor_octopus.sql`. `db` is the runtime pool, connected as
   * `ordre_app`; writing a switch is an owner-role statement.
   */
  describe('runtime database privileges', () => {
    /**
     * The driver's own message for a refused query, read off the error's `cause`.
     *
     * Drizzle wraps a failure in a `Failed query` error carrying the statement, so
     * the cause is where the reason for the refusal lives.
     *
     * @returns The cause's message, having asserted the query was refused.
     */
    const refusalReason = async (run: Promise<unknown>): Promise<string> => {
      try {
        await run;
      } catch (error) {
        const cause = (error as { cause?: unknown }).cause;

        return cause instanceof Error ? cause.message : String(error);
      }

      throw new Error('expected the query to be refused, but it succeeded');
    };

    test('the runtime role may read the switches', async () => {
      await expect(db.execute(sql`SELECT key FROM feature`)).resolves.toBeDefined();
    });

    test('the runtime role may not turn a switch on', async () => {
      await expect(
        refusalReason(db.execute(sql`UPDATE feature SET enabled = true WHERE key = 'login'`))
      ).resolves.toMatch(/permission denied/i);
    });

    test('the runtime role may not delete a switch out of existence', async () => {
      // A missing row reads as the coded default, so a delete closes a surface.
      await expect(
        refusalReason(db.execute(sql`DELETE FROM feature WHERE key = 'login'`))
      ).resolves.toMatch(/permission denied/i);
    });

    test('the runtime role may not insert a switch', async () => {
      await expect(
        refusalReason(db.execute(sql`INSERT INTO feature (key, enabled) VALUES ('smuggled', true)`))
      ).resolves.toMatch(/permission denied/i);
    });
  });
});
