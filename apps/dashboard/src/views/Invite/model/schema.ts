import { SignUpSchema, z } from '@ordre/core/schemas';

/**
 * The sign-up fields an invitee fills in. `email` is omitted because the invite
 * already fixes the address, and `app_invite_accept` refuses any account whose
 * email differs from the invite's.
 */
export const SignUpFormSchema = SignUpSchema.omit({ email: true });

export type SignUpFormValues = z.infer<typeof SignUpFormSchema>;
