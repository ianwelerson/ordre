import { z, type ZodType } from 'zod';

/**
 * Validates a response body against a Zod schema and returns it typed.
 *
 * Lets a test assert the *shape* of a response once (via the shared schema) and
 * then assert only the *values* that matter, instead of re-listing every field.
 * On a mismatch it throws with a prettified reason plus the received body, so a
 * failing test points straight at the offending field.
 *
 * @param schema - The schema the body is expected to satisfy.
 * @param body - The raw response body (e.g. `response.body`).
 * @returns The parsed body, typed as the schema's output.
 */
export const parseBody = <T>(schema: ZodType<T>, body: unknown): T => {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new Error(
      `Response body did not match schema:\n${z.prettifyError(result.error)}\n\nReceived: ${JSON.stringify(body, null, 2)}`
    );
  }

  return result.data;
};
