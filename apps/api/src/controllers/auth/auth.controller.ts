import { auth } from '#/config/auth.ts';
import { toNodeHandler } from 'better-auth/node';

export const authController = () => toNodeHandler(auth);
