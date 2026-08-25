import { logger } from '#/config/logger.ts';
import { appOrigins } from '#/config/urls.ts';
import { isTest } from '#env';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { API_BASE_PATH } from '@ordre/core/constants';
import { httpLogger } from '@ordre/monitoring/server';

import { clientIp } from './middlewares/client-ip.ts';
import routes from './routes/index.ts';

const app: Express = express();

/**
 * Two proxies sit in front of this app, so the client is the third address from
 * the socket end: the edge appends the tier ahead of it, and that tier appends
 * the client.
 */
app.set('trust proxy', 2);

/**
 * Everything this service serves lives under `API_BASE_PATH`, so anything else
 * is a scanner. Answering here, above helmet/cors/the access log, keeps that
 * traffic from touching the stack at all - and keeps it out of the logs entirely.
 *
 * `robots.txt` is answered rather than dropped so well-behaved crawlers stop
 * asking, leaving what remains unambiguously hostile.
 */
app.use((req, res, next) => {
  if (req.path === '/robots.txt') {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
    return;
  }

  if (req.path !== API_BASE_PATH && !req.path.startsWith(`${API_BASE_PATH}/`)) {
    res.status(404).end();
    return;
  }

  next();
});

app.use(helmet());

// @TODO: No rate limiter is mounted. Better Auth limits its own routes, but
// everything we serve ourselves is unmetered - including the public invite
// routes, which run an unauthenticated database call per request.

// Credentialed CORS against an explicit origin list.
app.use(cors({ origin: [...appOrigins], credentials: true }));

app.use(httpLogger('api', !isTest()));

// Above the routes so everything below - Better Auth included - reads one
// resolved client IP rather than re-deriving its own from the forwarded chain.
app.use(clientIp);

// Every route lives under the version prefix; the paths themselves are declared
// version-free in `@ordre/core/constants` (body parsers are wired inside this router).
app.use(API_BASE_PATH, routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
export default app;
