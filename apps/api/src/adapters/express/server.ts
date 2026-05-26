import { healthController } from '#controllers/health';
import { isProd, isTest } from '#env';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app: Express = express();

app.set('trust proxy', true);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan(isProd() ? 'combined' : 'dev', {
    skip: () => isTest(),
  })
);

app.get('/health', (_req, res) => {
  const result = healthController();
  res.status(result.status).json(result.body);
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
export default app;
