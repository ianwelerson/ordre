import { logger } from '#/config/logger.ts';
import { isTest } from '#env';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { httpLogger } from '@ordre/monitoring/server';

import routes from './routes/index.ts';

const app: Express = express();
const BASE_PATH = '/api';

app.set('trust proxy', true);

app.use(helmet());
app.use(cors());
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
