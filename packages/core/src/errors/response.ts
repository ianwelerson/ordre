import { errors as englishErrors } from '../messages/en/index.ts';
import type { ErrorMap, ErrorStatus, ResponseErrorBody } from '../types/index.ts';
import type { ErrorCode } from './catalog.ts';

/**
 * Resolves a code to the English sentence that goes on the wire.
 *
 * English, always - the response body is read by developers (logs, `curl`,
 * Sentry), never rendered to a user. A client looks the same code up in its own
 * locale through `@ordre/core/messages`, which is why `code` is the contract and
 * `message` is a courtesy.
 *
 * Only English is imported, so nothing that ships this pulls in every locale.
 */
export const errorMessage = (code: string): string => {
  return englishErrors[code as ErrorCode] ?? englishErrors.UNKNOWN_ERROR;
};

/**
 * Builds the error branch of a `Response` from an error catalog entry.
 *
 * The `code` returned to the client is the map key itself, so it can never drift
 * from the definition (no hand-typed string literal to keep in sync) - which is
 * why keys carry their resource prefix, since the client sees them without the
 * catalog name. Pass `details` for field-level context (e.g. validation errors).
 *
 * @example
 *   if (exists) return errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_SLUG_ALREADY_EXISTS');
 */
export const errorResponse = <M extends ErrorMap, K extends keyof M & string>(
  map: M,
  code: K,
  details?: Record<string, string>
): { status: ErrorStatus; body: ResponseErrorBody } => {
  const definition = map[code];

  return {
    status: definition?.status ?? 500,
    body: {
      code,
      message: errorMessage(code),
      ...(details && { details }),
    },
  };
};
