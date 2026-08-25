'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { type AppForm, useAppForm } from '@ordre/ui/form';

import { LOGIN_NOTICE, LOGIN_NOTICE_PARAM } from '@/shared/constants';
import { services } from '@/shared/services';

import { SetPasswordFormSchema, type SetPasswordFormValues } from './schema';

/**
 * Sets the password, then sends the visitor to the login screen with a notice.
 * The API does not create a session, so the new password has to be used once
 * before anything else works.
 *
 * @param token - The reset token from the emailed link.
 * @example
 * const { field, onSubmit, rootError, isBusy } = useSetPasswordForm(token);
 */
export const useSetPasswordForm = (token: string): AppForm<SetPasswordFormValues> => {
  const router = useRouter();

  const t = useTranslations();

  return useAppForm<SetPasswordFormValues>({
    schema: SetPasswordFormSchema,
    t,
    defaultValues: { newPassword: '', confirmPassword: '' },
    onSubmit: async ({ newPassword }) => {
      await services.auth.resetPassword({ newPassword, token });

      router.replace(
        `${DASHBOARD_ROUTES.login}?${LOGIN_NOTICE_PARAM}=${LOGIN_NOTICE.passwordReset}`
      );
    },
  });
};
