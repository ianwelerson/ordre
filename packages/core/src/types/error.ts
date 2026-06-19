import type { StatusCodes } from './http.ts';

/**
 * A single error entry: the message returned to the client and its HTTP status.
 */
export interface ErrorDefinition {
  message: string;
  status?: StatusCodes;
}

/**
 * A catalog of error definitions keyed by a stable identifier.
 */
export type ErrorMap = Record<string, ErrorDefinition>;
