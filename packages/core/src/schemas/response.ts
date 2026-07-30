import { z } from 'zod';

/**
 * The error branch of the `Response` envelope, as sent to the client. Mirrors
 * the `ResponseErrorBody` type and is used to validate error responses at
 * runtime (tests, OpenAPI) without re-listing the fields at each call site.
 */
export const ResponseErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.string()).optional(),
});
