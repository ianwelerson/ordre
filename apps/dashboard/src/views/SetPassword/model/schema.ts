import { ResetPasswordSchema, z } from '@ordre/core/schemas';

/**
 * The set-password form's contract, which is `ResetPasswordSchema` without the
 * token and with a confirmation field the submit handler strips before sending.
 *
 * `newPassword` keeps core's `min(8)`, because this screen is where the password
 * policy applies. The mismatch rule names its own translation key, which the
 * shared Zod error map cannot derive.
 */
export const SetPasswordFormSchema = ResetPasswordSchema.omit({ token: true })
  .extend({ confirmPassword: z.string().min(1) })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  });

export type SetPasswordFormValues = z.infer<typeof SetPasswordFormSchema>;
