'use client';

import { useTranslations } from 'next-intl';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { type AppForm, useAppForm } from '@ordre/ui/form';

import { SET_PASSWORD_SOURCE, SET_PASSWORD_SOURCE_PARAM } from '@/shared/constants';
import { services } from '@/shared/services';

import { ForgotPasswordFormSchema, type ForgotPasswordFormValues } from './schema';

type ForgotPasswordForm = AppForm<ForgotPasswordFormValues> & {
  onSubmit: ReturnType<AppForm<ForgotPasswordFormValues>['submit']>;
  /** True once the request has been accepted; the view swaps the form for the confirmation. */
  isSuccess: boolean;
};

export const useForgotPasswordForm = (): ForgotPasswordForm => {
  const t = useTranslations();

  const form = useAppForm<ForgotPasswordFormValues>({
    schema: ForgotPasswordFormSchema,
    t,
    defaultValues: { email: '' },
  });

  const onSubmit = form.submit(async (values) => {
    const redirectTo = new URL(DASHBOARD_ROUTES.setPassword, window.location.origin);

    redirectTo.searchParams.set(SET_PASSWORD_SOURCE_PARAM, SET_PASSWORD_SOURCE.forgotPassword);

    await services.auth.requestPasswordReset({ ...values, redirectTo: redirectTo.href });
  });

  return {
    ...form,
    onSubmit,
    isSuccess: form.formState.isSubmitSuccessful,
  };
};
