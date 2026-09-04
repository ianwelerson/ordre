import { sendResult } from '#/adapters/express/utils/send-result.ts';
import { featureGetAll } from '#controllers/feature';
import { Router } from 'express';

import { API_ROUTES } from '@ordre/core/constants';

const router: Router = Router();

router.get(
  API_ROUTES.features,
  sendResult(() => featureGetAll())
);

export default router;
