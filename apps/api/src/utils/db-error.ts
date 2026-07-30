/**
 * Helpers for turning raw database driver errors into something a controller can
 * map onto our error catalog (`@ordre/core/errors`) via `errorResponse`.
 *
 * Postgres reports failures with a stable `SQLSTATE` code (e.g. `23505` for a
 * unique violation). node-postgres surfaces that as `error.code`, plus
 * `error.constraint` / `error.detail`. Drizzle sometimes wraps the driver error,
 * so we look at both the error itself and its `.cause`.
 *
 * The controller stays in charge of the domain mapping (which constraint means
 * which business error); this module only classifies the raw error.
 */

export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
} as const;

export type PgErrorCode = (typeof PG_ERROR_CODES)[keyof typeof PG_ERROR_CODES];

export interface PgError {
  /** SQLSTATE code, e.g. `23505`. Typed as `string` since the driver can report any code. */
  code: string;
  constraint?: string;
  detail?: string;
  table?: string;
}

/** Type guard: `true` when `value` looks like a pg driver error (carries a string `code`). */
const hasStringCode = (value: unknown): value is PgError =>
  typeof value === 'object' &&
  value !== null &&
  'code' in value &&
  typeof (value as { code: unknown }).code === 'string';

/**
 * Unwraps a caught error into a Postgres driver error, checking both the error
 * itself and its `.cause` (Drizzle may wrap it). Returns `null` for anything
 * that is not a recognizable pg error.
 */
export const getPgError = (error: unknown): PgError | null => {
  if (hasStringCode(error)) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'cause' in error) {
    const { cause } = error as { cause: unknown };

    if (hasStringCode(cause)) {
      return cause;
    }
  }

  return null;
};

/**
 * True when the error is a unique-constraint violation. Pass `constraint` to
 * match a specific index (useful once a table has more than one unique column).
 */
export const isUniqueViolation = (error: unknown, constraint?: string): boolean => {
  const pgError = getPgError(error);

  if (!pgError || pgError.code !== PG_ERROR_CODES.UNIQUE_VIOLATION) {
    return false;
  }

  return constraint ? pgError.constraint === constraint : true;
};
