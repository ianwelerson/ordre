import { SignInSchema, z } from '@ordre/core/schemas';

/**
 * The login form's contract, which is `SignInSchema` with the password rule
 * relaxed to "not empty".
 *
 * Core's `min(8)` is the sign-up policy, and enforcing it here would lock out
 * any account whose password predates the rule. Login checks that something was
 * typed, and the API decides whether it means anything.
 */
export const LoginFormSchema = SignInSchema.extend({
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
