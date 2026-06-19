import express, { Router } from 'express';

import authRoutes from './auth/auth.routes.ts';
import healthRoutes from './health/health.routes.ts';

const routes: Router = Router();

routes.use(authRoutes);

routes.use(express.json());
routes.use(express.urlencoded({ extended: true }));

routes.use(healthRoutes);

export default routes;
