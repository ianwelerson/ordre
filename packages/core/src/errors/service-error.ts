import { CLIENT_ERRORS, type ClientErrorCode } from './client.ts';
import { errorMessage } from './response.ts';

/**
 * A failed call, as seen by whoever made it.
 *
 * Carries the catalog `code` so a caller branches on that rather than on message
 * strings, which are copy and change without notice. Every failure arrives as
 * this - a 403, a malformed body and a dropped connection alike - so a call site
 * needs one `catch` and one lookup.
 *
 * It lives in `@ordre/core` rather than in the HTTP client that throws it
 * because the things that *read* it - the shared form layer in `@ordre/ui`, the
 * error copy in `@ordre/core/messages` - sit beside the client rather than above
 * it, and none of them should import a transport just to get at an error shape.
 *
 * `code` is a plain `string`: it usually comes off the wire, and an API that has
 * been deployed ahead of a client can legitimately send one this build has never
 * heard of. Readers should fall back rather than assume.
 */
export class ServiceError extends Error {
  readonly code: string;
  /** The HTTP status, or the nominal one from `CLIENT_ERRORS` if no response arrived. */
  readonly status: number;
  /** Field-keyed messages, when the failure was about specific inputs. */
  readonly details?: Record<string, string>;

  constructor(code: string, message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ClientErrorOptions {
  /**
   * The HTTP status, when a response actually arrived. Omitted means there was
   * none, and the catalog's nominal status is used.
   */
  status?: number;
  /**
   * Replaces the catalog message. Only worth passing when the underlying failure
   * says something more specific than the catalog can - the browser's own
   * "Failed to fetch", say.
   */
  message?: string;
  details?: Record<string, string>;
}

/**
 * Builds a `ServiceError` for a failure the client itself detected.
 *
 * Everything but the code is derived from `CLIENT_ERRORS`, so a raise site never
 * restates a message or a status that the catalog already defines - the mistake
 * would be invisible until someone compared the two by eye.
 *
 * `code` is constrained to `ClientErrorCode`, so a typo, or a code deleted from
 * the catalog, is a compile error rather than a code nothing has copy for.
 */
export const clientError = (
  code: ClientErrorCode,
  { status, message, details }: ClientErrorOptions = {}
): ServiceError => {
  return new ServiceError(
    code,
    message ?? errorMessage(code),
    status ?? CLIENT_ERRORS[code].status,
    details
  );
};
