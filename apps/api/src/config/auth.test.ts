import { urls } from '#/config/urls.ts';
import { isFeatureEnabled } from '#/services/feature.ts';
import { APIError } from 'better-auth/api';

import { errorMessage } from '@ordre/core/errors';

import {
  composeName,
  defaultPasswordResetRedirect,
  defaultSignUpCallbackUrl,
  guardAuthFeature,
  remapAuthError,
} from './auth.ts';

vi.mock('#/services/feature.ts', () => ({ isFeatureEnabled: vi.fn() }));

const checkFeature = vi.mocked(isFeatureEnabled);

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

  describe('defaultPasswordResetRedirect', () => {
    it('points a reset request at the set-password screen', () => {
      const ctx = { path: '/request-password-reset', body: {} as { redirectTo?: string } };

      defaultPasswordResetRedirect(ctx);

      expect(ctx.body.redirectTo).toBe(urls.setPassword);
    });

    /** The destination is ours to choose, so a caller's own is not honoured. */
    it('overwrites a destination the caller supplied', () => {
      const ctx = { path: '/request-password-reset', body: { redirectTo: 'https://evil.test' } };

      defaultPasswordResetRedirect(ctx);

      expect(ctx.body.redirectTo).toBe(urls.setPassword);
    });

    it('leaves another endpoint alone', () => {
      const ctx = { path: '/sign-in/email', body: {} as { redirectTo?: string } };

      defaultPasswordResetRedirect(ctx);

      expect(ctx.body.redirectTo).toBeUndefined();
    });

    it('tolerates an endpoint reached with no body', () => {
      expect(() => defaultPasswordResetRedirect({ path: '/request-password-reset' })).not.toThrow();
    });
  });

  describe('guardAuthFeature', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('lets a sign-in through while `login` is on', async () => {
      checkFeature.mockResolvedValue(true);

      await expect(guardAuthFeature({ path: '/sign-in/email' })).resolves.toBeUndefined();
      expect(checkFeature).toHaveBeenCalledWith('login');
    });

    it('refuses a sign-in with FEATURE_LOGIN_DISABLED while `login` is off', async () => {
      checkFeature.mockResolvedValue(false);

      await expect(guardAuthFeature({ path: '/sign-in/email' })).rejects.toMatchObject({
        statusCode: 403,
        body: {
          code: 'FEATURE_LOGIN_DISABLED',
          message: errorMessage('FEATURE_LOGIN_DISABLED'),
        },
      });
    });

    it('refuses a sign-up with FEATURE_REGISTRATION_DISABLED while `registration` is off', async () => {
      checkFeature.mockResolvedValue(false);

      await expect(guardAuthFeature({ path: '/sign-up/email' })).rejects.toMatchObject({
        statusCode: 403,
        body: { code: 'FEATURE_REGISTRATION_DISABLED' },
      });
      expect(checkFeature).toHaveBeenCalledWith('registration');
    });

    it('throws an APIError, so Better Auth answers rather than the process failing', async () => {
      checkFeature.mockResolvedValue(false);

      await expect(guardAuthFeature({ path: '/sign-up/email' })).rejects.toBeInstanceOf(APIError);
    });

    it('leaves an unlisted path alone without reading a switch', async () => {
      await expect(guardAuthFeature({ path: '/request-password-reset' })).resolves.toBeUndefined();
      expect(checkFeature).not.toHaveBeenCalled();
    });

    it('does not gate reading a session, so live sessions survive a closed `login`', async () => {
      await expect(guardAuthFeature({ path: '/get-session' })).resolves.toBeUndefined();
      expect(checkFeature).not.toHaveBeenCalled();
    });
  });

  describe('composeName', () => {
    it('joins both parts into the single column Better Auth requires', () => {
      expect(composeName('Ada', 'Lovelace')).toBe('Ada Lovelace');
    });

    it('leaves no trailing space when there is no last name', () => {
      expect(composeName('Ada', '')).toBe('Ada');
    });

    it('answers an empty string when neither part is set', () => {
      expect(composeName('', '')).toBe('');
    });
  });
});
