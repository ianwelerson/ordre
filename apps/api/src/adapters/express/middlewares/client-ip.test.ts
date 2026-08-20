import type { NextFunction, Request, Response } from 'express';

import { CLIENT_IP_HEADER, type clientIp as ClientIp } from './client-ip.ts';

const { info } = vi.hoisted(() => ({ info: vi.fn() }));

vi.mock('#/config/logger.ts', () => ({ logger: { info } }));

/**
 * A fresh copy of the middleware. The chain sample it logs is deliberately once
 * per process, and "once" lives in module state - so a test that wants to see it
 * has to start from a module that has not spent it yet.
 */
const loadClientIp = async (): Promise<typeof ClientIp> => {
  vi.resetModules();

  return (await import('./client-ip.ts')).clientIp;
};

/**
 * Only the four things this middleware touches. `ip` is what Express resolved
 * from `trust proxy`; `headers` is what Better Auth will later be handed.
 */
const buildRequest = (ip: string | undefined, headers: Record<string, string | undefined> = {}) =>
  ({
    ip,
    // What `req.ips` yields under `trust proxy: 1` whatever the real chain holds:
    // Express truncates it by the trust count. Pinned to one entry so a `hops`
    // read off it could never accidentally satisfy the assertions below.
    ips: ip ? [ip] : [],
    headers,
    app: { get: () => 1 },
  }) as unknown as Request;

const run = (clientIp: typeof ClientIp, req: Request) => {
  const next = vi.fn() as unknown as NextFunction;

  clientIp(req, {} as Response, next);

  return next;
};

describe('middleware/clientIp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes the address Express resolved and continues', async () => {
    const clientIp = await loadClientIp();
    const req = buildRequest('203.0.113.7');

    const next = run(clientIp, req);

    expect(req.headers[CLIENT_IP_HEADER]).toBe('203.0.113.7');
    expect(next).toHaveBeenCalled();
  });

  it('accepts IPv6, including the IPv4-mapped form', async () => {
    const clientIp = await loadClientIp();
    const v6 = buildRequest('2001:db8::1');
    const mapped = buildRequest('::ffff:127.0.0.1');

    run(clientIp, v6);
    run(clientIp, mapped);

    expect(v6.headers[CLIENT_IP_HEADER]).toBe('2001:db8::1');
    expect(mapped.headers[CLIENT_IP_HEADER]).toBe('::ffff:127.0.0.1');
  });

  /**
   * The whole point of the header being private: a client that sends one is
   * writing into the same slot Better Auth reads, so the value has to be
   * replaced rather than merged with or deferred to.
   */
  it('overwrites a value the client supplied under the same name', async () => {
    const clientIp = await loadClientIp();
    const req = buildRequest('203.0.113.7', { [CLIENT_IP_HEADER]: '10.0.0.1' });

    run(clientIp, req);

    expect(req.headers[CLIENT_IP_HEADER]).toBe('203.0.113.7');
  });

  it('removes a client-supplied value when no address resolved', async () => {
    const clientIp = await loadClientIp();
    const req = buildRequest(undefined, { [CLIENT_IP_HEADER]: '10.0.0.1' });

    run(clientIp, req);

    expect(CLIENT_IP_HEADER in req.headers).toBe(false);
  });

  /**
   * Express splits `x-forwarded-for` without validating the entries, so a
   * misconfigured hop count can surface arbitrary text as `req.ip`. Deleted
   * rather than blanked: an empty string is a value every caller shares, which
   * is the shared-bucket failure this middleware exists to prevent.
   */
  it.each(['garbage', '', '1.2.3.4, 5.6.7.8'])(
    'removes the header when `req.ip` is not an address (%j)',
    async (ip) => {
      const clientIp = await loadClientIp();
      const req = buildRequest(ip, { [CLIENT_IP_HEADER]: '10.0.0.1' });

      run(clientIp, req);

      expect(CLIENT_IP_HEADER in req.headers).toBe(false);
    }
  );

  describe('the forwarded-chain sample', () => {
    it('is logged once, and only for a request that carries the header', async () => {
      const clientIp = await loadClientIp();

      run(clientIp, buildRequest('203.0.113.7'));

      expect(info).not.toHaveBeenCalled();

      run(
        clientIp,
        buildRequest('203.0.113.7', { 'x-forwarded-for': '198.51.100.1, 203.0.113.7' })
      );
      run(
        clientIp,
        buildRequest('203.0.113.8', { 'x-forwarded-for': '198.51.100.2, 203.0.113.8' })
      );

      expect(info).toHaveBeenCalledTimes(1);
      expect(info).toHaveBeenCalledWith(
        expect.objectContaining({
          forwarded: '198.51.100.1, 203.0.113.7',
          resolved: '203.0.113.7',
        }),
        expect.any(String)
      );
    });

    /**
     * The reason the sample exists at all. `req.ips` is the obvious source and
     * the one that cannot work: Express truncates the chain by the very
     * `trust proxy` value being checked, so it reports the configured count
     * straight back and a two-hop platform is indistinguishable from a one-hop
     * one. Counting the raw header is what makes them tell apart.
     */
    it.each([
      ['203.0.113.7', 1],
      ['198.51.100.1, 203.0.113.7', 2],
      ['1.1.1.1, 198.51.100.1, 203.0.113.7', 3],
    ])('counts %j as %i hops, not what `req.ips` reports', async (forwarded, hops) => {
      const clientIp = await loadClientIp();

      run(clientIp, buildRequest('203.0.113.7', { 'x-forwarded-for': forwarded }));

      expect(info).toHaveBeenCalledWith(expect.objectContaining({ hops }), expect.any(String));
    });
  });
});
