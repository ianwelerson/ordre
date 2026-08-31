import { jsonResponse, stubFetch } from '#/test/fetch.ts';

import { API_BASE_PATH, API_ROUTES } from '@ordre/core/constants';

import { createServices } from './index.ts';

const BASE_URL = 'https://api.ordre.localhost';

/**
 * The composition itself: that `createServices` wires one configured client into
 * every service, so a call site carries neither a base URL nor a path.
 */
describe('createServices', () => {
  it('routes a service call through the configured client', async () => {
    const user = {
      id: '8f0e2f6a-8b31-4f2e-9c11-2d1f0a9b7c65',
      email: 'a@ordre.app',
      name: 'A Tester',
      firstName: 'A',
      lastName: 'Tester',
      emailVerified: true,
      image: null,
      createdAt: '2026-08-18T12:00:00.000Z',
      updatedAt: '2026-08-18T12:00:00.000Z',
    };
    const { fetch, calls } = stubFetch(jsonResponse({ token: 'tok_1', user }));

    const services = createServices({ baseUrl: BASE_URL, fetch });

    const result = await services.auth.signIn({ email: 'a@ordre.app', password: 'password' });

    expect(calls[0]?.url).toBe(`${BASE_URL}${API_BASE_PATH}${API_ROUTES.auth.signIn}`);
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.init.body).toBe('{"email":"a@ordre.app","password":"password"}');
    expect(result.user.id).toBe(user.id);
  });
});
