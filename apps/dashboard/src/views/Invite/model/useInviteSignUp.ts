'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { type ErrorCode, ServiceError } from '@ordre/core/errors';
import { WorkspaceInvitePreview } from '@ordre/core/types';
import { type AppForm, useAppForm } from '@ordre/ui/form';

import { loginRedirect } from '@/shared/authLinks';
import { LOGIN_NOTICE } from '@/shared/constants';
import { services } from '@/shared/services';

import { SignUpFormSchema, type SignUpFormValues } from './schema';

/**
 * The code Better Auth returns from sign-up when the address already has an
 * account. Typed as `ErrorCode` so a value missing from the catalog fails the
 * build rather than silently never matching.
 */
const EXISTING_ACCOUNT_CODE: ErrorCode = 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL';

const isExistingAccount = (error: unknown): boolean => {
  return error instanceof ServiceError && error.code === EXISTING_ACCOUNT_CODE;
};

/**
 * Splits the name on the invite into the two fields the form collects, so an
 * invitee starts with both filled rather than their whole name in one.
 *
 * The first whitespace-separated token is the first name and the rest is the last
 * name, so a single-word invite name leaves the last name empty.
 */
const splitName = (name: string): { firstName: string; lastName: string } => {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);

  return { firstName, lastName: rest.join(' ') };
};

/**
 * Creates the account the invite was addressed to, then accepts the invite with
 * it. The email comes from the invite rather than from a field, which is what
 * `SignUpFormSchema` encodes by omitting it.
 *
 * @param token - The invite token from the route.
 * @param invite - The loaded preview. Its email and name seed the sign-up.
 * @example
 * const form = useInviteSignUp(token, invite);
 */
export const useInviteSignUp = (
  token: string,
  invite: WorkspaceInvitePreview
): AppForm<SignUpFormValues> => {
  const router = useRouter();

  const t = useTranslations();

  // Sign-up is not idempotent, accept is. If the account is created and the
  // accept then fails, a retry has to resume at the accept: re-posting the
  // sign-up returns an existing-account error and sends the visitor to a login
  // screen they no longer need.
  const [signedUp, setSignedUp] = useState(false);

  return useAppForm<SignUpFormValues>({
    schema: SignUpFormSchema,
    t,
    defaultValues: { ...splitName(invite.name), password: '', productNewsOptIn: false },
    onSubmit: async ({ firstName, lastName, password, productNewsOptIn }) => {
      if (!signedUp) {
        try {
          await services.auth.signUp({
            name: [firstName, lastName].filter(Boolean).join(' '),
            firstName,
            lastName,
            email: invite.email,
            password,
            productNewsOptIn,
          });

          setSignedUp(true);
        } catch (error) {
          if (!isExistingAccount(error)) {
            throw error;
          }

          // The invitee already has an account, so this is not a failure. Send
          // them to sign in with the invite as the destination.
          router.replace(loginRedirect(DASHBOARD_ROUTES.invite(token), LOGIN_NOTICE.accountExists));

          return;
        }
      }

      await services.invite.accept(token);

      router.replace('/');
    },
  });
};
