import type { ErrorStatus } from './http.ts';

/**
 * A single error entry: the message returned to the client and its HTTP status.
 * `status` is restricted to error codes (4xx/5xx) since these definitions only
 * ever describe failures, and is required so an entry can never fall back to a
 * generic 500 by omission.
 */
export interface ErrorDefinition {
  message: string;
  status: ErrorStatus;
}

/**
 * A catalog of error definitions keyed by a stable identifier.
 */
export type ErrorMap = Record<string, ErrorDefinition>;
