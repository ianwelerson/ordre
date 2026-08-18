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
  INVALID_INPUT: { status: 400 },
  VALIDATION_ERROR: { status: 400 },
  MISSING_FIELD: { status: 400 },
  FIELD_NOT_ALLOWED: { status: 400 },
  BODY_MUST_BE_AN_OBJECT: { status: 400 },
  ASYNC_VALIDATION_NOT_SUPPORTED: { status: 500 },
} satisfies ErrorMap;
