import { useTranslations } from 'next-intl';

import { WorkspaceInvitePreview } from '@ordre/core/types';
import { Alert } from '@ordre/ui/components';

import { AuthAction, AuthHeading } from '@/shared/components';

import { useInviteAccept } from '../model/useInviteAccept';
import { mono } from './chunks';
import { InviteWorkspace } from './InviteWorkspace';

interface InviteAcceptProps {
  token: string;
  invite: WorkspaceInvitePreview;
  /** The signed-in address, already confirmed to match the invite's. */
  email: string;
}

/**
 * Confirmation card shown when the invitee is already signed in as the invited
 * address. Joining is a button rather than an automatic action on arrival,
 * because accepting adds the account to someone else's workspace.
 */
export const InviteAccept = ({ token, invite, email }: InviteAcceptProps) => {
  const { accept, pending, errorKey } = useInviteAccept(token);

  const t = useTranslations('Invite');
  // Error copy sits outside the `Invite` namespace, so the banner resolves its
  // key through the unscoped translator.
  const tRoot = useTranslations();

  return (
    <>
      <AuthHeading
        eyebrow={t('eyebrow')}
        media={<InviteWorkspace invite={invite} />}
        title={t('accept.title')}
        subtitle={t.rich('accept.subtitle', { email, mono })}
      />
      <div className="flex flex-col gap-4.5">
        {errorKey && <Alert>{tRoot(errorKey)}</Alert>}
        <AuthAction
          onClick={accept}
          loading={pending}
          disabled={pending}
          loadingLabel={t('submitting')}
        >
          {t('submit')}
        </AuthAction>
      </div>
    </>
  );
};
