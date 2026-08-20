import { SignInSchema, z } from '@ordre/core/schemas';

/**
 * The login form's contract: core's shape, with the password rule relaxed.
 *
 * `SignInSchema` carries `min(8)` because that is the *sign-up* policy.
 * Enforcing it here would lock out any account whose password predates the rule,
 * and it states the policy on a screen with no business stating it. Login checks
 * that something was typed; the API decides whether it means anything.
 *
 * No messages: the shared Zod error map in `@ordre/core/schemas` turns every
 * issue into a translation key, and `@ordre/core/messages` holds the copy.
 */
export const LoginFormSchema = SignInSchema.extend({
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;
