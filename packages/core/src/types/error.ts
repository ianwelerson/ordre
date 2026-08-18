import type { ErrorStatus } from './http.ts';

/**
 * A single error entry.
 *
 * Status only - the words live in `@ordre/core/messages`, keyed by the same code.
 *
 * `status` is restricted to error codes (4xx/5xx) since these definitions only
 * ever describe failures, and is required so an entry can never fall back to a
 * generic 500 by omission.
 */
export interface ErrorDefinition {
  status: ErrorStatus;
}

/**
 * A catalog of error definitions keyed by a stable identifier.
 */
export type ErrorMap = Record<string, ErrorDefinition>;
