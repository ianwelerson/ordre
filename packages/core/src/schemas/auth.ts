import { z } from 'zod';

export const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

export const SignUpSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(8),
});

/** `/sign-out` answers `{ success }`, unlike every other route's `{ status }`. */
export const SignOutResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * Only the email address. Where the emailed link lands is the API's to decide - see
 * `defaultPasswordResetRedirect`.
 */
export const RequestPasswordResetSchema = z.object({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8),
  token: z.string(),
});

export const RevokeSessionSchema = z.object({
  token: z.string(),
});

export const SessionUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string(),
  emailVerified: z.boolean(),
  image: z.url().nullish(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const SessionDataSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  userAgent: z.string().nullable(),
  ipAddress: z.union([z.ipv4(), z.ipv6()]).or(z.literal('')).nullable(),
  token: z.string(),
  expiresAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/**
 * What Better Auth answers a successful sign-in *and* sign-up with.
 *
 * One schema because it is one envelope: both routes mint a session, set the
 * same cookie, and hand back the token with the user it belongs to.
 */
export const AuthSessionResponseSchema = z.object({
  token: z.string().nullable(),
  user: SessionUserSchema,
});

export const SessionResponseSchema = z
  .object({
    session: SessionDataSchema,
    user: SessionUserSchema,
  })
  .nullable();

export const AuthSuccessResponseSchema = z.object({
  status: z.boolean(),
});

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type RevokeSessionInput = z.infer<typeof RevokeSessionSchema>;
export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>;
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
