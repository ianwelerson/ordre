import { ResetPasswordSchema, z } from '@ordre/core/schemas';

/**
 * The set-password form's contract: core's shape without the token, which
 * arrives on the emailed link rather than from the user, plus a confirmation
 * field the API never sees - the submit handler strips it.
 *
 * `newPassword` keeps core's `min(8)`: unlike login, this screen is exactly
 * where the password policy applies.
 *
 * No messages: the shared Zod error map in `@ordre/core/schemas` turns every
 * issue into a translation key, and `@ordre/core/messages` holds the copy. The
 * mismatch rule names its own key, which the map cannot derive.
 */
export const SetPasswordFormSchema = ResetPasswordSchema.omit({ token: true })
  .extend({ confirmPassword: z.string().min(1) })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  });

export type SetPasswordFormValues = z.infer<typeof SetPasswordFormSchema>;
