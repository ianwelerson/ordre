import { SignInSchema, z } from '@ordre/core/schemas';

/**
 * The forgot-password form's contract, which is `SignInSchema` narrowed to the
 * email. It is derived rather than declared fresh so the email rule cannot drift
 * from the one the login form applies to the same address.
 */
export const ForgotPasswordFormSchema = SignInSchema.pick({
  email: true,
});

export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordFormSchema>;
