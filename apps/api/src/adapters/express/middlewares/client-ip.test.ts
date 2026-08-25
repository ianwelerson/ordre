import type { NextFunction, Request, Response } from 'express';

import { CLIENT_IP_HEADER, clientIp } from './client-ip.ts';

/**
 * Builds the minimal request shape this middleware touches. `ip` is what Express
 * resolved from `trust proxy`, and `headers` is what Better Auth is later handed.
 */
const buildRequest = (ip: string | undefined, headers: Record<string, string | undefined> = {}) =>
  ({ ip, headers }) as unknown as Request;

const run = (req: Request) => {
  const next = vi.fn() as unknown as NextFunction;

  clientIp(req, {} as Response, next);

  return next;
};

describe('middleware/clientIp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes the address Express resolved and continues', () => {
    const req = buildRequest('203.0.113.7');

    const next = run(req);

    expect(req.headers[CLIENT_IP_HEADER]).toBe('203.0.113.7');
    expect(next).toHaveBeenCalled();
  });

  it('accepts IPv6, including the IPv4-mapped form', () => {
    const v6 = buildRequest('2001:db8::1');
    const mapped = buildRequest('::ffff:127.0.0.1');

    run(v6);
    run(mapped);

    expect(v6.headers[CLIENT_IP_HEADER]).toBe('2001:db8::1');
    expect(mapped.headers[CLIENT_IP_HEADER]).toBe('::ffff:127.0.0.1');
  });

  /**
   * A client that sends this header writes into the same slot Better Auth reads,
   * so the value has to be replaced rather than merged with or deferred to.
   */
  it('overwrites a value the client supplied under the same name', () => {
    const req = buildRequest('203.0.113.7', { [CLIENT_IP_HEADER]: '10.0.0.1' });

    run(req);

    expect(req.headers[CLIENT_IP_HEADER]).toBe('203.0.113.7');
  });

  it('removes a client-supplied value when no address resolved', () => {
    const req = buildRequest(undefined, { [CLIENT_IP_HEADER]: '10.0.0.1' });

    run(req);

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
    (ip) => {
      const req = buildRequest(ip, { [CLIENT_IP_HEADER]: '10.0.0.1' });

      run(req);

      expect(CLIENT_IP_HEADER in req.headers).toBe(false);
    }
  );
});
