import { describe, expect, it } from 'vitest';

import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { ServiceError } from '@ordre/core/errors';

import { applyServiceError, serviceErrorKey } from './applyServiceError';

/**
 * A stand-in for the two `UseFormReturn` members this touches. Rendering a real
 * form would test react-hook-form; what matters here is *what gets written into
 * form state*, which is exactly what a component cannot show you.
 */
const stubForm = (values: FieldValues) => {
  const errors: Record<string, string> = {};

  const form = {
    getValues: () => values,
    setError: (name: string, { message }: { message?: string }) => {
      errors[name] = message ?? '';
    },
  } as unknown as UseFormReturn<FieldValues>;

  return { form, errors };
};

describe('serviceErrorKey', () => {
  it('returns a key, never a translated sentence', () => {
    const error = new ServiceError('INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password', 401);

    expect(serviceErrorKey(error)).toBe('errors.INVALID_EMAIL_OR_PASSWORD');
  });

  it('falls back for a code this build has never heard of', () => {
    const error = new ServiceError('SOME_FUTURE_CODE', 'whatever', 400);

    expect(serviceErrorKey(error)).toBe('errors.UNKNOWN_ERROR');
  });

  it('falls back for something that is not a ServiceError at all', () => {
    expect(serviceErrorKey(new TypeError('boom'))).toBe('errors.UNKNOWN_ERROR');
  });
});

describe('applyServiceError', () => {
  it('puts a whole-submission failure on root, as a key', () => {
    const { form, errors } = stubForm({ email: '', password: '' });

    applyServiceError(form, new ServiceError('INVALID_EMAIL_OR_PASSWORD', 'msg', 401));

    expect(errors).toEqual({ root: 'errors.INVALID_EMAIL_OR_PASSWORD' });
  });

  it('puts field details on their fields, keeping the validation keys', () => {
    const { form, errors } = stubForm({ email: '', password: '' });

    applyServiceError(
      form,
      new ServiceError('INVALID_INPUT', 'msg', 400, { email: 'validation.email' })
    );

    expect(errors).toEqual({ email: 'validation.email' });
    expect(errors.root).toBeUndefined();
  });

  it('falls back to the banner when no detail names a field this form renders', () => {
    const { form, errors } = stubForm({ email: '', password: '' });

    applyServiceError(
      form,
      new ServiceError('INVALID_INPUT', 'msg', 400, { workspaceSlug: 'validation.required' })
    );

    expect(errors).toEqual({ root: 'errors.INVALID_INPUT' });
  });
});
