/** The values a failed invite insert would carry into the log. */
export const INVITEE_EMAIL = 'jane.doe@example.com';
export const INVITE_TOKEN = 'inv_live_5f3a9c8e';

export type QueryError = Error & { query: string; params: unknown[] };

/**
 * Builds an error shaped like Drizzle's `DrizzleQueryError`, whose constructor
 * renders `Failed query: ${query}\nparams: ${params}` into its own message and
 * keeps `query` and `params` as own properties.
 *
 * Rebuilt here rather than imported, so `@ordre/monitoring` needs no database
 * dependency; check it against `drizzle-orm/errors` when that package moves.
 */
export const failedQueryError = (query: string, params: unknown[], cause?: Error): QueryError => {
  const error = new Error(`Failed query: ${query}\nparams: ${params}`) as QueryError;

  error.query = query;
  error.params = params;
  error.cause = cause;

  return error;
};

/**
 * Builds an error shaped like a node-postgres unique violation, which quotes the
 * offending row back in `detail`.
 */
export const uniqueViolation = (detail: string): Error => {
  const error = new Error('duplicate key value violates unique constraint "invite_email_unique"');

  return Object.assign(error, { code: '23505', detail, where: 'PL/pgSQL function' });
};

/** A failed invite insert: the driver error, wrapped the way Drizzle wraps it. */
export const failedInviteInsert = (): QueryError =>
  failedQueryError(
    'insert into "invite" ("email", "name", "token") values ($1, $2, $3)',
    [INVITEE_EMAIL, 'Jane Doe', INVITE_TOKEN],
    uniqueViolation(`Key (email)=(${INVITEE_EMAIL}) already exists.`)
  );
