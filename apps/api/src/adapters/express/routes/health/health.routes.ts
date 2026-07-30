import { sendResult } from '#/adapters/express/utils/send-result.ts';
import { healthController, healthPath } from '#controllers/health';
import { Router } from 'express';

const router: Router = Router();

router.get(
  healthPath,
  sendResult(() => healthController())
);

export default router;
