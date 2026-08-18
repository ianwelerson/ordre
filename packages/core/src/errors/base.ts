import type { ErrorMap } from '../types/index.ts';

/**
 * Cross-cutting errors that belong to no single domain: the generic fallback
 * plus the two access decisions (authentication and authorization) every route
 * can return.
 *
 * `UNAUTHORIZED` and `FORBIDDEN` live here rather than in `AUTH_ERRORS` because
 * that catalog is a verbatim mirror of Better Auth's codes; these two are ours
 * and are returned by our own guards.
 */
export const BASE_ERRORS = {
  INTERNAL_ERROR: { status: 500 },
  UNAUTHORIZED: { status: 401 },
  FORBIDDEN: { status: 403 },
} satisfies ErrorMap;
