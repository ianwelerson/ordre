'use client';

import { useTranslations } from 'next-intl';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import {
  Alert,
  Button,
  Card,
  Eyebrow,
  TextField,
  TextLink,
  Typography,
} from '@ordre/ui/components';

import { useForgotPasswordForm } from '../model/useForgotPasswordForm';

export default function ForgotPasswordPage() {
  const t = useTranslations('ForgotPassword');
  const { field, onSubmit, rootError, isBusy, isSuccess, getValues } = useForgotPasswordForm();

  return (
    <Card
      padding="none"
      className="flex w-full max-w-[460px] flex-col gap-7 px-10 pt-10 pb-8 max-[460px]:rounded-none"
    >
      <div className="flex flex-col gap-3.5">
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <div className="flex flex-col gap-2.5">
          <Typography tag="h1" variant="h2">
            {isSuccess ? t('success.title') : t('title')}
          </Typography>
          <Typography tag="p" variant="body">
            {isSuccess ? t('success.subtitle') : t('subtitle')}
          </Typography>
        </div>
      </div>
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
          <Button
            size="lg"
            trailingIcon="arrow-right"
            fullWidth
            type="submit"
            loading={isBusy}
            disabled={isBusy}
            loadingLabel={t('submitting')}
          >
            {t('submit')}
          </Button>
        </form>
      )}
      <div className="mt-1 text-center">
        <Typography tag="p" variant="caption">
          {t('remembered')}{' '}
          <TextLink variant="inline" href={DASHBOARD_ROUTES.login}>
            {t('backToLogin')}
          </TextLink>
        </Typography>
      </div>
    </Card>
  );
}
