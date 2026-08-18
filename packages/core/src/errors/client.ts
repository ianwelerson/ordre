import type { ErrorMap } from '../types/index.ts';

/**
 * Failures an HTTP client raises on its own behalf: the request never reached
 * the API, or what came back is not something the API would ever send.
 *
 * They sit in the same catalog as the server's codes so a consumer has one
 * vocabulary to map. A form should not need to know whether `error.code` came
 * from a route guard or from a dropped connection - both arrive as a code it can
 * look up copy for.
 *
 * `status` is nominal here, since nothing on the server returns these. The
 * thrown `ServiceError` reports the real HTTP status when there was a response
 * and this one when there was not.
 */
export const CLIENT_ERRORS = {
  NETWORK_ERROR: { status: 503 },
  MALFORMED_RESPONSE: { status: 502 },
  UNKNOWN_ERROR: { status: 500 },
} satisfies ErrorMap;

/** The codes a client raises itself - the narrow half of `ErrorCode`. */
export type ClientErrorCode = keyof typeof CLIENT_ERRORS;
