import type { ErrorMap, ErrorStatus, ResponseErrorBody } from '../types/index.ts';

/**
 * Builds the error branch of a `Response` from an error catalog entry.
 *
 * The `code` returned to the client is the map key itself, so it can never drift
 * from the definition (no hand-typed string literal to keep in sync). Pass
 * `details` for field-level context (e.g. validation errors).
 *
 * @example
 *   if (exists) return errorResponse(WORKSPACE_ERRORS, 'SLUG_ALREADY_EXISTS');
 */
export const errorResponse = <M extends ErrorMap, K extends keyof M & string>(
  map: M,
  code: K,
  details?: Record<string, string>
): { status: ErrorStatus; body: ResponseErrorBody } => {
  // `code` is constrained to `keyof M`, so this is always present; the fallbacks
  // only exist to satisfy `noUncheckedIndexedAccess` on the index signature.
  const definition = map[code];

  return {
    status: definition?.status ?? 500,
    body: {
      code,
      message: definition?.message ?? 'Unexpected error',
      ...(details && { details }),
    },
  };
};
