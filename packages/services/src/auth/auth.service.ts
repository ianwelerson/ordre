import { API_ROUTES } from '@ordre/core/constants';
import {
  AuthSuccessResponseSchema,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type RevokeSessionInput,
  SessionResponseSchema,
  type SignInInput,
  SignInResponseSchema,
} from '@ordre/core/schemas';

import type { HttpClient } from '../http/client.ts';

export type AuthService = ReturnType<typeof createAuthService>;

/**
 * Return types are inferred from the response schemas, not annotated: the
 * schema is handed to the client, which validates the body against it, so what
 * a caller sees promised is exactly what was checked at the boundary.
 */
export const createAuthService = (http: HttpClient) => ({
  signIn: (payload: SignInInput) =>
    http.post(API_ROUTES.auth.signIn, payload, SignInResponseSchema),
  signOut: () => http.post(API_ROUTES.auth.signOut, undefined, AuthSuccessResponseSchema),
  requestPasswordReset: (payload: RequestPasswordResetInput) =>
    http.post(API_ROUTES.auth.requestPasswordReset, payload, AuthSuccessResponseSchema),
  resetPassword: (payload: ResetPasswordInput) =>
    http.post(API_ROUTES.auth.resetPassword, payload, AuthSuccessResponseSchema),
  getSession: () => http.get(API_ROUTES.auth.session, SessionResponseSchema),
  revokeSession: (payload: RevokeSessionInput) =>
    http.post(API_ROUTES.auth.revokeSession, payload, AuthSuccessResponseSchema),
});
