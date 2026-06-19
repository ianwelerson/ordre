import { app, BASE_PATH } from '#/adapters/express/server.ts';
import { healthPath } from '#controllers/health';
import request from 'supertest';
import z from 'zod';

describe('Health', () => {
  test(`GET ${BASE_PATH}${healthPath}`, async () => {
    const response = await request(app).get(`${BASE_PATH}${healthPath}`).send().expect(200);

    expect(response.body).toEqual({
      ok: true,
      timestamp: expect.schemaMatching(z.string()),
    });
  });
});
