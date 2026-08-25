import { useTranslations } from 'next-intl';

import { WorkspaceInvitePreview } from '@ordre/core/types';
import { Alert, TextLink } from '@ordre/ui/components';

import { AuthAction, AuthFootnote, AuthHeading } from '@/shared/components';

import { useInviteSignOut } from '../model/useInviteSignOut';
import { mono } from './chunks';
import { InviteWorkspace } from './InviteWorkspace';

interface InviteMismatchProps {
  invite: WorkspaceInvitePreview;
  /** The signed-in address, already confirmed to differ from the invite's. */
  email: string;
  /** Re-runs the page's load once the session is gone. */
  onSignedOut: () => void;
}

/**
 * Card shown when the visitor is signed in as an address other than the invited
 * one. Both addresses are named so the reader can tell which is which, and
 * accepting is not offered because `app_invite_accept` refuses it with
 * `INVITE_EMAIL_MISMATCH`.
 */
export const InviteMismatch = ({ invite, email, onSignedOut }: InviteMismatchProps) => {
  const { signOut, pending, errorKey } = useInviteSignOut(onSignedOut);

  const t = useTranslations('Invite');
  const tRoot = useTranslations();

  return (
    <>
      <AuthHeading
        eyebrow={t('mismatch.eyebrow')}
        media={<InviteWorkspace invite={invite} />}
        title={t('mismatch.title')}
        subtitle={t.rich('mismatch.subtitle', { invited: invite.email, current: email, mono })}
      />
      <div className="flex flex-col gap-4.5">
        {errorKey && <Alert>{tRoot(errorKey)}</Alert>}
        <AuthAction
          onClick={signOut}
          loading={pending}
          disabled={pending}
          loadingLabel={t('mismatch.submitting')}
        >
          {t('mismatch.submit')}
        </AuthAction>
      </div>
      <AuthFootnote>
        <TextLink variant="inline" href="/">
          {t('mismatch.dashboard')}
        </TextLink>
      </AuthFootnote>
    </>
  );
};
