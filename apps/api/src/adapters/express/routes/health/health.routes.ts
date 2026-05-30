import { healthController, healthPath } from '#controllers/health';
import { type Request, type Response, Router } from 'express';

const router: Router = Router();

router.get(healthPath, (_req: Request, res: Response) => {
  const result = healthController();
  res.status(result.status).json(result.body);
});

export default router;
