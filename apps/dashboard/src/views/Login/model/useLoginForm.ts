'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import { type AppForm, useAppForm } from '@ordre/ui/form';

import { safeRedirect } from '@/shared/safeRedirect';
import { services } from '@/shared/services';

import { LoginFormSchema, type LoginFormValues } from './schema';

type LoginForm = AppForm<LoginFormValues> & {
  onSubmit: ReturnType<AppForm<LoginFormValues>['submit']>;
};

export const useLoginForm = (): LoginForm => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslations();

  const form = useAppForm<LoginFormValues>({
    schema: LoginFormSchema,
    t,
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = form.submit(async (values) => {
    await services.auth.signIn(values);

    router.replace(safeRedirect(searchParams.get('next')));
  });

  return { ...form, onSubmit };
};
