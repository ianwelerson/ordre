'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import {
  Alert,
  Button,
  Card,
  Eyebrow,
  PasswordField,
  TextLink,
  Typography,
} from '@ordre/ui/components';

import {
  SET_PASSWORD_SOURCE,
  SET_PASSWORD_SOURCE_PARAM,
  type SetPasswordSource,
} from '@/shared/constants';

import { useSetPasswordForm } from '../model/useSetPasswordForm';

const resolveSource = (param: string | null): SetPasswordSource => {
  return Object.values(SET_PASSWORD_SOURCE).includes(param as SetPasswordSource)
    ? (param as SetPasswordSource)
    : SET_PASSWORD_SOURCE.forgotPassword;
};

export default function SetPasswordPage() {
  const t = useTranslations('SetPassword');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { field, onSubmit, rootError, isBusy } = useSetPasswordForm(token ?? '');
  const source = resolveSource(searchParams.get(SET_PASSWORD_SOURCE_PARAM));

  const copy = token ? source : 'invalidLink';

  return (
    <Card
      padding="none"
      className="flex w-full max-w-[460px] flex-col gap-7 px-10 pt-10 pb-8 max-[460px]:rounded-none"
    >
      <div className="flex flex-col gap-3.5">
        <Eyebrow>{t(`${copy}.eyebrow`)}</Eyebrow>
        <div className="flex flex-col gap-2.5">
          <Typography tag="h1" variant="h2">
            {t(`${copy}.title`)}
          </Typography>
          <Typography tag="p" variant="body">
            {t(`${copy}.subtitle`)}
          </Typography>
        </div>
      </div>
      {token ? (
        <>
          <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
            {rootError && <Alert>{rootError}</Alert>}
            <PasswordField
              {...field('newPassword')}
              size="lg"
              label={t('password.label')}
              placeholder={t('password.placeholder')}
              autoComplete="new-password"
              autoFocus
            />
            <PasswordField
              {...field('confirmPassword')}
              size="lg"
              label={t('confirm.label')}
              placeholder={t('confirm.placeholder')}
              autoComplete="new-password"
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
          <div className="mt-1 text-center">
            <Typography tag="p" variant="caption">
              {t('help.entry')}{' '}
              <TextLink variant="inline" href={DASHBOARD_ROUTES.forgotPassword}>
                {t('help.link')}
              </TextLink>
            </Typography>
          </div>
        </>
      ) : (
        <Button
          size="lg"
          trailingIcon="arrow-right"
          fullWidth
          href={DASHBOARD_ROUTES.forgotPassword}
        >
          {t('invalidLink.action')}
        </Button>
      )}
    </Card>
  );
}
