import { APIError } from 'better-auth/api';

import { remapAuthError } from './auth.ts';

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
        message: 'Invalid email or password',
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
        message: 'Validation Error',
        details: {
          email: 'Invalid input',
          password: 'Invalid input',
        },
      });
    });
  });
});
