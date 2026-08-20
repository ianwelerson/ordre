'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { type AppForm, useAppForm } from '@ordre/ui/form';

import { LOGIN_NOTICE, LOGIN_NOTICE_PARAM } from '@/shared/constants';
import { services } from '@/shared/services';

import { SetPasswordFormSchema, type SetPasswordFormValues } from './schema';

type SetPasswordForm = AppForm<SetPasswordFormValues> & {
  onSubmit: ReturnType<AppForm<SetPasswordFormValues>['submit']>;
};

/**
 * @param token - The reset token from the emailed link.
 */
export const useSetPasswordForm = (token: string): SetPasswordForm => {
  const router = useRouter();

  const t = useTranslations();

  const form = useAppForm<SetPasswordFormValues>({
    schema: SetPasswordFormSchema,
    t,
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = form.submit(async ({ newPassword }) => {
    await services.auth.resetPassword({ newPassword, token });

    router.replace(`${DASHBOARD_ROUTES.login}?${LOGIN_NOTICE_PARAM}=${LOGIN_NOTICE.passwordReset}`);
  });

  return { ...form, onSubmit };
};
