'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import {
  DASHBOARD_ROUTES,
  SET_PASSWORD_SOURCE,
  SET_PASSWORD_SOURCE_PARAM,
  type SetPasswordSource,
} from '@ordre/core/constants';
import { Alert, PasswordField, TextLink } from '@ordre/ui/components';

import { AuthAction, AuthCard, AuthFootnote, AuthHeading } from '@/shared/components';

import { useSetPasswordForm } from '../model/useSetPasswordForm';

/**
 * Resolves the `source` param to a known value, falling back to the reset copy.
 * The param only picks wording, so an unrecognised value is not an error.
 */
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
    <AuthCard>
      <AuthHeading
        eyebrow={t(`${copy}.eyebrow`)}
        title={t(`${copy}.title`)}
        subtitle={t(`${copy}.subtitle`)}
      />
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
            <AuthAction
              type="submit"
              loading={isBusy}
              disabled={isBusy}
              loadingLabel={t('submitting')}
            >
              {t('submit')}
            </AuthAction>
          </form>
          <AuthFootnote>
            {t('help.entry')}{' '}
            <TextLink variant="inline" href={DASHBOARD_ROUTES.forgotPassword}>
              {t('help.link')}
            </TextLink>
          </AuthFootnote>
        </>
      ) : (
        <AuthAction href={DASHBOARD_ROUTES.forgotPassword}>{t('invalidLink.action')}</AuthAction>
      )}
    </AuthCard>
  );
}
