'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import { type AppForm, useAppForm } from '@ordre/ui/form';

import { safeRedirect } from '@/shared/safeRedirect';
import { services } from '@/shared/services';

import { LoginFormSchema, type LoginFormValues } from './schema';

/**
 * Signs the visitor in, then redirects to the `?next=` the proxy stashed when it
 * bounced them here. `safeRedirect` is what makes that param safe to follow.
 *
 * @example
 * const { field, onSubmit, rootError, isBusy } = useLoginForm();
 */
export const useLoginForm = (): AppForm<LoginFormValues> => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations();

  return useAppForm<LoginFormValues>({
    schema: LoginFormSchema,
    t,
    defaultValues: { email: '', password: '', rememberMe: true },
    onSubmit: async (values) => {
      await services.auth.signIn(values);

      router.replace(safeRedirect(searchParams.get('next')));
    },
  });
};
