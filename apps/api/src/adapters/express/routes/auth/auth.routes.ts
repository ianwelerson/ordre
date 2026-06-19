import { authController, authPath } from '#controllers/auth';
import { Router } from 'express';

const router: Router = Router();

router.all(authPath, authController());

export default router;
