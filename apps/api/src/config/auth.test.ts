import { urls } from '#/config/urls.ts';
import { APIError } from 'better-auth/api';

import { errorMessage } from '@ordre/core/errors';

import { defaultSignUpCallbackUrl, remapAuthError } from './auth.ts';

describe('config/auth', () => {
  describe('remapAuthError', () => {
    it('should return undefined for a value that is not a Better Auth API error', () => {
      expect(remapAuthError(null)).toBeUndefined();
      expect(remapAuthError({ body: { code: 'INVALID_EMAIL' } })).toBeUndefined();
    });

    it('should return undefined when the API error carries no string code', () => {
      const error = new APIError(400, { message: 'No code here' });

      expect(remapAuthError(error)).toBeUndefined();
    });

    it('should return undefined when the code is not in our catalog', () => {
      const error = new APIError(400, { code: 'NOT_A_REAL_CODE', message: 'whatever' });

      expect(remapAuthError(error)).toBeUndefined();
    });

    it('should remap a known code onto our status and message while keeping the code', () => {
      const error = new APIError('UNAUTHORIZED', {
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: "Better Auth's original message",
      });

      const result = remapAuthError(error);

      expect(result).toBeInstanceOf(APIError);
      expect(result?.statusCode).toBe(401);
      expect(result?.body).toMatchObject({
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: errorMessage('INVALID_EMAIL_OR_PASSWORD'),
      });
      expect(result?.body).not.toHaveProperty('details');
    });

    it('should expand a VALIDATION_ERROR message into a per-field details map', () => {
      const error = new APIError(400, {
        code: 'VALIDATION_ERROR',
        message: '[body.email] Invalid input; [body.password] Invalid input',
      });

      const result = remapAuthError(error);

      expect(result?.statusCode).toBe(400);
      expect(result?.body).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: errorMessage('VALIDATION_ERROR'),
        details: {
          email: 'Invalid input',
          password: 'Invalid input',
        },
      });
    });
  });

  describe('defaultSignUpCallbackUrl', () => {
    it('points a sign-up with no callback at the dashboard', () => {
      const ctx = { path: '/sign-up/email', body: {} };

      defaultSignUpCallbackUrl(ctx);

      expect(ctx.body).toEqual({ callbackURL: urls.dashboard });
    });

    it('leaves a callback the caller chose alone', () => {
      const ctx = {
        path: '/sign-up/email',
        body: { callbackURL: 'https://dashboard.test/welcome' },
      };

      defaultSignUpCallbackUrl(ctx);

      expect(ctx.body.callbackURL).toBe('https://dashboard.test/welcome');
    });

    it.each(['/sign-in/email', '/reset-password', '/get-session'])('ignores %s', (path) => {
      const ctx = { path, body: {} as { callbackURL?: string } };

      defaultSignUpCallbackUrl(ctx);

      expect(ctx.body.callbackURL).toBeUndefined();
    });

    it('tolerates an endpoint reached with no body', () => {
      expect(() => defaultSignUpCallbackUrl({ path: '/sign-up/email' })).not.toThrow();
    });
  });
});
