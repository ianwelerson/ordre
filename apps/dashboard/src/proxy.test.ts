import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAMES } from '@ordre/core/constants';

import proxy from './proxy';

/** The subset of the service options the proxy actually builds. */
type ServiceOptions = { baseUrl: string; fetch: typeof globalThis.fetch };

const getSession = vi.fn();
const createServices = vi.fn<
  (options: ServiceOptions) => { auth: { getSession: typeof getSession } }
>(() => ({ auth: { getSession } }));

vi.mock('@ordre/services', () => ({
  createServices: (options: ServiceOptions) => createServices(options),
}));

const ORIGIN = 'https://app.ordre.test';
const SESSION_COOKIE = `${SESSION_COOKIE_NAMES[1]}=abc123`;

const buildRequest = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, ORIGIN), { headers: cookie ? { cookie } : {} });

/** Returns where a response sends the browser, or `null` when it passes through. */
const redirectedTo = (response: Response) => {
  const location = response.headers.get('location');

  return location ? new URL(location).pathname + new URL(location).search : null;
};

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.ordre.test');
    getSession.mockResolvedValue({ session: {}, user: {} });
  });

  describe('without a session cookie', () => {
    it('sends a protected path to login, carrying the destination', async () => {
      const response = await proxy(buildRequest('/settings?tab=billing'));

      expect(redirectedTo(response)).toBe('/login?next=%2Fsettings%3Ftab%3Dbilling');
    });

    it.each(['/login', '/forgot-password', '/set-password', '/get-started', '/invite/tok_abc'])(
      'lets %s through',
      async (path) => {
        const response = await proxy(buildRequest(path));

        expect(redirectedTo(response)).toBeNull();
      }
    );

    /** Cookie presence decides this branch, so nothing should reach the API. */
    it('never calls the API', async () => {
      await proxy(buildRequest('/settings'));

      expect(getSession).not.toHaveBeenCalled();
    });
  });

  describe('with a session cookie', () => {
    it('lets a protected path through without asking the API', async () => {
      const response = await proxy(buildRequest('/settings', SESSION_COOKIE));

      expect(redirectedTo(response)).toBeNull();
      expect(getSession).not.toHaveBeenCalled();
    });

    it('bounces off an auth screen once the session is confirmed', async () => {
      const response = await proxy(buildRequest('/login', SESSION_COOKIE));

      expect(redirectedTo(response)).toBe('/');
    });

    it('bounces to the destination the login redirect stashed', async () => {
      const response = await proxy(buildRequest('/login?next=%2Fsettings', SESSION_COOKIE));

      expect(redirectedTo(response)).toBe('/settings');
    });

    /**
     * The invite is the one public route a session is allowed to reach, because
     * only the page can tell the visitor whether it was addressed to this account.
     */
    it('lets an invite through without asking the API', async () => {
      const response = await proxy(buildRequest('/invite/tok_abc', SESSION_COOKIE));

      expect(redirectedTo(response)).toBeNull();
      expect(getSession).not.toHaveBeenCalled();
    });

    /**
     * Without this, `login?next=/invite/:token` would drop a returning invitee on
     * the dashboard with the invite still unaccepted.
     */
    it('bounces to an invite the login redirect stashed', async () => {
      const response = await proxy(buildRequest('/login?next=%2Finvite%2Ftok_abc', SESSION_COOKIE));

      expect(redirectedTo(response)).toBe('/invite/tok_abc');
    });

    /**
     * Both values would land back on an auth screen and bounce again on arrival.
     * `safeRedirect` only proves same-origin, so the public check is what breaks
     * the loop.
     */
    it.each(['%2Flogin', 'https%3A%2F%2Fevil.com'])(
      'ignores a `next` that would bounce again or leave the site (%s)',
      async (next) => {
        const response = await proxy(buildRequest(`/login?next=${next}`, SESSION_COOKIE));

        expect(redirectedTo(response)).toBe('/');
      }
    );

    /**
     * A cookie the API no longer honours has to fall through, or the visitor is
     * trapped: refused by the login screen, 401'd by everything behind it.
     */
    it('falls through to the auth screens when the session is dead', async () => {
      getSession.mockResolvedValue(null);

      const response = await proxy(buildRequest('/login', SESSION_COOKIE));

      expect(redirectedTo(response)).toBeNull();
    });

    it('falls through when the API cannot be reached', async () => {
      getSession.mockRejectedValue(new Error('network'));

      const response = await proxy(buildRequest('/login', SESSION_COOKIE));

      expect(redirectedTo(response)).toBeNull();
    });

    it('falls through when the API URL is not configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_API_URL', '');

      const response = await proxy(buildRequest('/login', SESSION_COOKIE));

      expect(redirectedTo(response)).toBeNull();
      expect(getSession).not.toHaveBeenCalled();
    });

    /**
     * A middleware-originated fetch carries no cookies of its own, so the
     * browser's header is forwarded by hand. The wait is capped because this call
     * sits in front of a navigation.
     */
    it('forwards the cookie header and caps the wait', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('null'));

      await proxy(buildRequest('/login', SESSION_COOKIE));

      await createServices.mock.calls[0]?.[0].fetch('https://api.ordre.test/probe', {});

      const init = fetchSpy.mock.calls[0]?.[1] as RequestInit;

      expect((init.headers as Record<string, string>).cookie).toBe(SESSION_COOKIE);
      expect(init.signal).toBeInstanceOf(AbortSignal);

      fetchSpy.mockRestore();
    });
  });
});
