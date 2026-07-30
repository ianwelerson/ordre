import { ZodError, type ZodType } from 'zod';

import { errorResponse, VALIDATION_ERRORS } from '@ordre/core/errors';
import type { Response } from '@ordre/core/types';

/**
 * Parses Better Auth's flattened validation error message into a per-field map.
 *
 * On a `VALIDATION_ERROR`, Better Auth concatenates every field error into a
 * single string of `[<path>] <message>` segments joined by `; `, e.g.:
 *
 *   `[body.email] Invalid input...; [body.password] Invalid input...`
 *
 * This splits that string back into a `{ field: message }` object, stripping the
 * leading `body.` path prefix so keys match the request payload fields:
 *
 *   `{ email: "Invalid input...", password: "Invalid input..." }`
 *
 * Segments that don't match the `[path] message` shape are skipped, so a format
 * change in a future Better Auth release degrades to an empty/partial object
 * rather than throwing.
 *
 * @param message - The `body.message` string from a Better Auth `VALIDATION_ERROR`.
 * @returns A map of field name to its error message (empty if nothing parsed).
 *
 */
export const parseBetterAuthValidationDetails = (message: string): Record<string, string> => {
  const details: Record<string, string> = {};

  if (!message || typeof message !== 'string') {
    return {};
  }

  for (const part of message.split(';')) {
    const match = part.trim().match(/^\[([^\]]+)\]\s*(.*)$/);
    if (!match?.[1]) {
      continue;
    }

    const field = match[1].replace(/^body\./, '');
    details[field] = match[2] ?? '';
  }

  return details;
};

/**
 * Outcome of a validation helper: either the parsed data, or a ready-to-return
 * `INVALID_INPUT` response the caller can `return result.response` directly.
 * Shared by {@link validateRequestBody} and {@link validateField}.
 */
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response<never> };

/**
 * Validates a request payload against a Zod schema and normalizes the outcome.
 *
 * On success, returns the parsed (and transformed) data. On a `ZodError`, returns
 * a ready-to-return `INVALID_INPUT` response - status pulled from the error
 * catalog, `details` mapping each field path to its message - so callers can
 * `return result.response` without re-attaching a status. Non-Zod errors are
 * rethrown for the caller to handle.
 *
 * @param schema - The Zod schema to parse against.
 * @param payload - The request body to validate.
 * @returns `{ success: true, data }` or `{ success: false, response }`.
 */
export const validateRequestBody = <T>(
  schema: ZodType<T>,
  payload: object
): ValidationResult<T> => {
  try {
    const data = schema.parse(payload);

    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.reduce<Record<string, string>>((acc, issue) => {
        acc[issue.path.join('.')] = issue.message;

        return acc;
      }, {});

      return {
        success: false,
        response: errorResponse(VALIDATION_ERRORS, 'INVALID_INPUT', details),
      };
    }

    throw error;
  }
};

/**
 * Validates a single value (e.g. a path param like an id or slug) against a Zod
 * schema and normalizes the outcome.
 *
 * The single-field counterpart to {@link validateRequestBody}: on success returns
 * the parsed value, on failure returns a ready-to-return `INVALID_INPUT` response
 * whose `details` key is `field` and whose message is the first Zod issue. Unlike
 * `validateRequestBody` this uses `safeParse`, so a non-matching value is a normal
 * failure result rather than a thrown error.
 *
 * @param schema - The Zod schema to parse against (e.g. `z.uuid()`).
 * @param value - The raw value to validate.
 * @param field - The field name to key the error `details` under (e.g. `'id'`).
 * @returns `{ success: true, data }` or `{ success: false, response }`.
 */
export const validateField = <T>(
  schema: ZodType<T>,
  value: unknown,
  field: string
): ValidationResult<T> => {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    return {
      success: false,
      response: errorResponse(VALIDATION_ERRORS, 'INVALID_INPUT', {
        [field]: parsed.error.issues[0]?.message ?? VALIDATION_ERRORS.INVALID_INPUT.message,
      }),
    };
  }

  return { success: true, data: parsed.data };
};
