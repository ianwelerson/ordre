import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { ERROR_CATALOG, type ErrorCode, ServiceError } from '@ordre/core/errors';

/**
 * What a failure resolves to when it carries no code we recognise.
 *
 * Annotated as `ErrorCode` rather than left a bare string, so deleting it from
 * the catalog is a compile error here instead of a form that renders a blank
 * banner at runtime.
 */
const FALLBACK_CODE: ErrorCode = 'UNKNOWN_ERROR';

/**
 * The translation key for a failure - not the sentence.
 *
 * Everything stored in form state is a key: the resolver writes `validation.*`
 * from the Zod error map, and this writes `errors.*`. Translation happens once,
 * when `useAppForm` reads the state back. Resolving here as well would put a
 * finished sentence where a key is expected, and the second lookup would fail.
 *
 * The catalog membership check is what makes the key safe to hand to `t`: an API
 * deployed ahead of this build can send a code we have no copy for, and asking
 * for a missing message throws in next-intl.
 */
export const serviceErrorKey = (error: unknown): string => {
  const code = error instanceof ServiceError ? error.code : FALLBACK_CODE;

  return `errors.${code in ERROR_CATALOG ? code : FALLBACK_CODE}`;
};

/**
 * Puts a failed request onto the form.
 *
 * Two destinations, decided by what the failure is actually about:
 *
 * - `details` is keyed by field and its values are validation keys, which is the
 *   same shape `setError` wants. Those land on the field that caused them.
 * - anything else is about the submission as a whole and goes to `root`, which
 *   is where a form renders its banner.
 *
 * The distinction matters beyond tidiness: `INVALID_EMAIL_OR_PASSWORD` is about
 * the pair, and marking either field would both say something untrue about it
 * and tell an attacker which half was wrong.
 *
 * A `details` key naming a field this form does not render is skipped - RHF
 * accepts it and nothing ever displays it. If that leaves nothing shown, the
 * banner takes over, so a submit never silently does nothing.
 */
export const applyServiceError = <TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  error: unknown
): void => {
  const details = error instanceof ServiceError ? error.details : undefined;
  const fields = Object.keys(form.getValues());

  const applied = Object.entries(details ?? {}).filter(([field]) => fields.includes(field));

  applied.forEach(([field, key]) => {
    form.setError(field as Path<TValues>, { message: key });
  });

  if (applied.length === 0) {
    form.setError('root', { message: serviceErrorKey(error) });
  }
};
