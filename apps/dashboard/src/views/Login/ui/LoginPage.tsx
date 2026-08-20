'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { DASHBOARD_ROUTES } from '@ordre/core/constants';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  // Divider,
  Eyebrow,
  PasswordField,
  TextField,
  TextLink,
  Typography,
} from '@ordre/ui/components';

import { LOGIN_NOTICE, LOGIN_NOTICE_PARAM, type LoginNotice } from '@/shared/constants';

import { useLoginForm } from '../model/useLoginForm';

/**
 * The query string is the user's to edit, so an unknown notice renders nothing
 * rather than trusting the param.
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
    <Card
      padding="none"
      className="flex w-full max-w-[460px] flex-col gap-7 px-10 pt-10 pb-8 max-[460px]:rounded-none"
    >
      <div className="flex flex-col gap-3.5">
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <div className="flex flex-col gap-2.5">
          <Typography tag="h1" variant="h2">
            {t('title')}
          </Typography>
          <Typography tag="p" variant="body">
            {t('subtitle')}
          </Typography>
        </div>
      </div>
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
        {/* <Divider>{t('or')}</Divider>
        <Button size="lg" leadingIcon="mail" fullWidth variant="secondary">
          {t('magicLink')}
        </Button> */}
      </div>
      <div className="mt-1 text-center">
        <Typography tag="p" variant="caption">
          {t('noAccount')}{' '}
          <TextLink variant="inline" href={DASHBOARD_ROUTES.getStarted}>
            {t('createOne')}
          </TextLink>
        </Typography>
      </div>
    </Card>
  );
}
