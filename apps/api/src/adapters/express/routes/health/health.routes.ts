import { sendResult } from '#/adapters/express/utils/send-result.ts';
import { healthController } from '#controllers/health';
import { Router } from 'express';

import { API_ROUTES } from '@ordre/core/constants';

const router: Router = Router();

router.get(
  API_ROUTES.health,
  sendResult(() => healthController())
);

export default router;
