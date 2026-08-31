import { useTranslations } from 'next-intl';

import { MARKETING_ROUTES } from '@ordre/core/constants';
import { WorkspaceInvitePreview } from '@ordre/core/types';
import { Alert, Checkbox, PasswordField, TextField, TextLink } from '@ordre/ui/components';

import { AuthAction, AuthFootnote, AuthHeading } from '@/shared/components';

import { useInviteSignUp } from '../model/useInviteSignUp';
import { mono } from './chunks';
import { InviteWorkspace } from './InviteWorkspace';

interface InviteSignUpProps {
  token: string;
  invite: WorkspaceInvitePreview;
}

/**
 * Sign-up card shown when the visitor has no account. The email is displayed
 * rather than editable, because `app_invite_accept` refuses any account whose
 * address differs from the invite's.
 */
export const InviteSignUp = ({ token, invite }: InviteSignUpProps) => {
  const { field, onSubmit, rootError, isBusy } = useInviteSignUp(token, invite);

  const t = useTranslations('Invite');

  return (
    <>
      <AuthHeading
        eyebrow={t('eyebrow')}
        media={<InviteWorkspace invite={invite} />}
        title={t('signUp.title')}
        subtitle={t.rich('signUp.subtitle', { email: invite.email, mono })}
      />
      <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
        {rootError && <Alert>{rootError}</Alert>}
        <TextField
          {...field('firstName')}
          type="text"
          size="lg"
          label={t('firstName.label')}
          placeholder={t('firstName.placeholder')}
          autoComplete="given-name"
          autoFocus
        />
        <TextField
          {...field('lastName')}
          type="text"
          size="lg"
          label={t('lastName.label')}
          placeholder={t('lastName.placeholder')}
          autoComplete="family-name"
        />
        <PasswordField
          {...field('password')}
          size="lg"
          label={t('password.label')}
          placeholder={t('password.placeholder')}
          autoComplete="new-password"
        />
        <Checkbox
          {...field('productNewsOptIn')}
          label={t('productNews.label')}
          description={t('productNews.description')}
        />
        <AuthAction type="submit" loading={isBusy} disabled={isBusy} loadingLabel={t('submitting')}>
          {t('submit')}
        </AuthAction>
      </form>
      <AuthFootnote>
        {t.rich('terms', {
          terms: (chunks) => (
            <TextLink variant="inline" href={MARKETING_ROUTES.terms}>
              {chunks}
            </TextLink>
          ),
          privacy: (chunks) => (
            <TextLink variant="inline" href={MARKETING_ROUTES.privacy}>
              {chunks}
            </TextLink>
          ),
        })}
      </AuthFootnote>
    </>
  );
};
