import { logger } from '#/config/logger.ts';
import type { NextFunction, Request, Response } from 'express';
import { isIP } from 'node:net';

/**
 * The header this API resolves a client IP from.
 *
 * Private and non-standard on purpose: the middleware below overwrites it on
 * every request, so a client-sent value can never survive to be read - the
 * guarantee `x-forwarded-for` cannot give.
 */
export const CLIENT_IP_HEADER = 'x-ordre-client-ip';

/**
 * @TODO Remove this log, and the `loggedChain` flag with it, once `hops` has
 * been read off a deployed instance and `trust proxy` in `server.ts` set to it.
 */
let loggedChain = false;

/**
 * Logs one sample of the forwarded chain, so `trust proxy` can be set from
 * reality rather than assumed.
 *
 * If the platform runs more hops than `trust proxy` counts, the resolved IP is
 * an internal address identical for every request, and every caller lands in one
 * rate-limit bucket - the failure this middleware exists to prevent. Read `hops`
 * and set `trust proxy` to it; `resolved` should be an address you recognise as
 * the client.
 *
 * `hops` comes off the raw header because `req.ips` cannot answer this: Express
 * truncates the chain by the very `trust proxy` value being checked.
 *
 * Once per process, and only for a request carrying the header, so a health
 * check on a direct connection can't be mistaken for the sample.
 */
const logForwardedChain = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];

  if (loggedChain || typeof forwarded !== 'string') {
    return;
  }

  loggedChain = true;

  logger.info(
    {
      forwarded,
      hops: forwarded.split(',').filter((entry) => entry.trim()).length,
      resolved: req.ip,
      trustProxy: req.app.get('trust proxy'),
    },
    'client ip: forwarded chain sample - set `trust proxy` to `hops`'
  );
};

/**
 * Restates Express's resolved client IP as a header, for the one consumer that
 * cannot read `req.ip`.
 *
 * Better Auth gets a web `Request` rebuilt from the raw node headers, so it
 * re-derives the client IP by parsing `x-forwarded-for` itself. With no
 * `trustedProxies` set it rejects any chain longer than one entry, and a request
 * that resolves to no IP falls into a single shared rate-limit bucket - which
 * any client can force by sending its own `x-forwarded-for`. Writing Express's
 * answer where Better Auth looks (`advanced.ipAddress.ipAddressHeaders`) keeps
 * `trust proxy` the only place that decides who is trusted.
 *
 * Overwrite, never merge: whatever arrived under this name came off the network.
 *
 * `req.ip` is not guaranteed to be an address - Express splits and trims
 * `x-forwarded-for` but never validates it - so it is checked with `isIP`, and
 * the header is deleted rather than blanked so downstream reads unknown instead
 * of an empty string equal for every caller.
 */
export const clientIp = (req: Request, _res: Response, next: NextFunction) => {
  logForwardedChain(req);

  if (req.ip && isIP(req.ip)) {
    req.headers[CLIENT_IP_HEADER] = req.ip;
  } else {
    delete req.headers[CLIENT_IP_HEADER];
  }

  next();
};
