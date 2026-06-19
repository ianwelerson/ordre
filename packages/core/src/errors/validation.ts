import type { ErrorMap } from '../types/index.ts';

/**
 * Validation / request-shape errors, shared across the API as the single source
 * of truth for anything input-related.
 *
 * `INVALID_INPUT` is our own canonical validation error (Better Auth's
 * `VALIDATION_ERROR` is remapped onto it). The remaining keys mirror Better
 * Auth's validation-flavored `BASE_ERROR_CODES` verbatim, so a raw Better Auth
 * response can still be mapped by `code`.
 */
export const VALIDATION_ERRORS = {
  INVALID_INPUT: {
    status: 400,
    message: 'Validation error',
  },
  VALIDATION_ERROR: {
    status: 400,
    message: 'Validation Error',
  },
  MISSING_FIELD: {
    status: 400,
    message: 'Field is required',
  },
  FIELD_NOT_ALLOWED: {
    status: 400,
    message: 'Field not allowed to be set',
  },
  BODY_MUST_BE_AN_OBJECT: {
    status: 400,
    message: 'Body must be an object',
  },
  ASYNC_VALIDATION_NOT_SUPPORTED: {
    status: 500,
    message: 'Async validation is not supported',
  },
} satisfies ErrorMap;
