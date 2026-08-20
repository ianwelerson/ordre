import { SignInSchema, z } from '@ordre/core/schemas';

/**
 * The forgot-password form's contract: the sign-in shape reduced to the email.
 *
 * Derived from `SignInSchema` rather than declared fresh so the email rule can
 * never drift from the one the login form applies to the same address.
 */
export const ForgotPasswordFormSchema = SignInSchema.pick({
  email: true,
});

export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordFormSchema>;
