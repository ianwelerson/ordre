'use client';

import { useTranslations } from 'next-intl';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import { Alert, TextField, TextLink } from '@ordre/ui/components';

import { AuthAction, AuthCard, AuthFootnote, AuthHeading } from '@/shared/components';

import { useForgotPasswordForm } from '../model/useForgotPasswordForm';

export default function ForgotPasswordPage() {
  const t = useTranslations('ForgotPassword');
  const { field, onSubmit, rootError, isBusy, isSuccess, getValues } = useForgotPasswordForm();

  return (
    <AuthCard>
      <AuthHeading
        eyebrow={t('eyebrow')}
        title={isSuccess ? t('success.title') : t('title')}
        subtitle={isSuccess ? t('success.subtitle') : t('subtitle')}
      />
      {isSuccess ? (
        <Alert tone="success">{t('success.body', { email: getValues('email') })}</Alert>
      ) : (
        <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
          {rootError && <Alert>{rootError}</Alert>}
          <TextField
            {...field('email')}
            type="email"
            size="lg"
            label={t('email.label')}
            placeholder={t('email.placeholder')}
            autoComplete="email"
            autoFocus
          />
          <AuthAction
            type="submit"
            loading={isBusy}
            disabled={isBusy}
            loadingLabel={t('submitting')}
          >
            {t('submit')}
          </AuthAction>
        </form>
      )}
      <AuthFootnote>
        {t('remembered')}{' '}
        <TextLink variant="inline" href={DASHBOARD_ROUTES.login}>
          {t('backToLogin')}
        </TextLink>
      </AuthFootnote>
    </AuthCard>
  );
}
