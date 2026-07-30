import type { ErrorStatus } from './http.ts';

/**
 * A single error entry: the message returned to the client and its HTTP status.
 * `status` is restricted to error codes (4xx/5xx) since these definitions only
 * ever describe failures.
 */
export interface ErrorDefinition {
  message: string;
  status?: ErrorStatus;
}

/**
 * A catalog of error definitions keyed by a stable identifier.
 */
export type ErrorMap = Record<string, ErrorDefinition>;
