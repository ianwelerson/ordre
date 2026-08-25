'use client';

import { useTranslations } from 'next-intl';

import { type AppForm, useAppForm } from '@ordre/ui/form';

import { services } from '@/shared/services';

import { ForgotPasswordFormSchema, type ForgotPasswordFormValues } from './schema';

type ForgotPasswordForm = AppForm<ForgotPasswordFormValues> & {
  /** True once the request has been accepted; the view swaps the form for the confirmation. */
  isSuccess: boolean;
};

/**
 * Requests the password reset email. There is no success redirect, because the
 * next step happens in the visitor's inbox and the view swaps itself for the
 * confirmation instead.
 *
 * @example
 * const { field, onSubmit, submitted } = useForgotPasswordForm();
 */
export const useForgotPasswordForm = (): ForgotPasswordForm => {
  const t = useTranslations();

  const form = useAppForm<ForgotPasswordFormValues>({
    schema: ForgotPasswordFormSchema,
    t,
    defaultValues: { email: '' },
    onSubmit: async (values) => {
      await services.auth.requestPasswordReset(values);
    },
  });

  return {
    ...form,
    isSuccess: form.formState.isSubmitSuccessful,
  };
};
