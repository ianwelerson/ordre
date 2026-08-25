'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import {
  Alert,
  // Button,
  Checkbox,
  // Divider,
  PasswordField,
  TextField,
  TextLink,
} from '@ordre/ui/components';

import { withNext } from '@/shared/authLinks';
import { AuthAction, AuthCard, AuthFootnote, AuthHeading } from '@/shared/components';
import { LOGIN_NOTICE, LOGIN_NOTICE_PARAM, type LoginNotice } from '@/shared/constants';

import { useLoginForm } from '../model/useLoginForm';

/**
 * Resolves the `notice` param to a known value, or `null`. The query string
 * belongs to the visitor, so an unrecognised value renders no banner.
 */
const resolveNotice = (param: string | null): LoginNotice | null => {
  return Object.values(LOGIN_NOTICE).includes(param as LoginNotice) ? (param as LoginNotice) : null;
};

export default function LoginPage() {
  const t = useTranslations('Login');
  const searchParams = useSearchParams();
  const { field, onSubmit, rootError, isBusy } = useLoginForm();

  const notice = resolveNotice(searchParams.get(LOGIN_NOTICE_PARAM));

  return (
    <AuthCard>
      <AuthHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
      <div className="flex flex-col gap-6">
        <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
          {notice && !rootError && <Alert tone="success">{t(`notices.${notice}`)}</Alert>}
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
          <PasswordField
            {...field('password')}
            size="lg"
            label={t('password.label')}
            placeholder={t('password.placeholder')}
            autoComplete="current-password"
            labelAction={
              <TextLink
                variant="inline"
                href={DASHBOARD_ROUTES.forgotPassword}
                className="text-2xs"
              >
                {t('password.forgot')}
              </TextLink>
            }
          />
          <Checkbox {...field('rememberMe')} label={t('remember')} />
          <AuthAction
            type="submit"
            loading={isBusy}
            disabled={isBusy}
            loadingLabel={t('submitting')}
          >
            {t('submit')}
          </AuthAction>
        </form>
        {/* <Divider>{t('or')}</Divider>
        <Button size="lg" leadingIcon="mail" fullWidth variant="secondary">
          {t('magicLink')}
        </Button> */}
      </div>
      <AuthFootnote>
        {t('noAccount')}{' '}
        <TextLink
          variant="inline"
          href={withNext(DASHBOARD_ROUTES.getStarted, searchParams.get('next'))}
        >
          {t('createOne')}
        </TextLink>
      </AuthFootnote>
    </AuthCard>
  );
}
