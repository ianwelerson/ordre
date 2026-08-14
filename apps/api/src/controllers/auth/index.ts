import { API_ROUTES } from '@ordre/core/constants';

// Controller
export { authController } from './auth.controller.ts';

// Mount pattern, not an endpoint: Better Auth owns everything below its base, so
// this is an Express wildcard rather than one of the paths in `API_ROUTES.auth`.
export const authPath = `${API_ROUTES.auth.base}/{*any}`;
