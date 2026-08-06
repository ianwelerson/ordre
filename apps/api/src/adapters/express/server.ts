import { logger } from '#/config/logger.ts';
import { appOrigins } from '#/config/urls.ts';
import { isTest } from '#env';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { httpLogger } from '@ordre/monitoring/server';

import routes from './routes/index.ts';

const app: Express = express();
const BASE_PATH = '/api';

app.set('trust proxy', true);

/**
 * Everything this service serves lives under `/api`, so anything else is a
 * scanner. Answering here, above helmet/cors/the access log, keeps that traffic
 * from touching the stack at all - and keeps it out of the logs entirely.
 *
 * `robots.txt` is answered rather than dropped so well-behaved crawlers stop
 * asking, leaving what remains unambiguously hostile.
 */
app.use((req, res, next) => {
  if (req.path === '/robots.txt') {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
    return;
  }

  if (req.path !== BASE_PATH && !req.path.startsWith(`${BASE_PATH}/`)) {
    res.status(404).end();
    return;
  }

  next();
});

app.use(helmet());

// Credentialed CORS against an explicit origin list.
app.use(cors({ origin: [...appOrigins], credentials: true }));

app.use(httpLogger('api', !isTest()));

// All API routes live under /api (body parsers are wired inside this router).
app.use(BASE_PATH, routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app, BASE_PATH };
export default app;
