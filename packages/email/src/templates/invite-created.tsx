import type { WorkspaceMemberRole } from '@ordre/core/enums';
import type { EmailRoleField } from '@ordre/core/types';

import { DetailBox } from '../components/DetailBox.tsx';
import { EmailShell } from '../components/EmailShell.tsx';
import type { TemplateProps } from '../types.ts';

export type InviteCreatedEmailProps = TemplateProps<'email:invite:created'>;

/**
 * The copy field naming each role.
 *
 * `satisfies Record<WorkspaceMemberRole, ...>` makes a new role a compile error
 * here as well as in the message bundles.
 */
const ROLE_FIELDS = {
  owner: 'roleOwner',
  admin: 'roleAdmin',
  member: 'roleMember',
} as const satisfies Record<WorkspaceMemberRole, EmailRoleField>;

/**
 * Invites someone into a workspace.
 *
 * The only message whose recipient may not have an account yet, which is why it
 * renders in the inviter's locale rather than the recipient's.
 */
export const InviteCreatedEmail = ({ locale, copy, ...variables }: InviteCreatedEmailProps) => {
  const { t, shared } = copy;
  const invited_role = t(ROLE_FIELDS[variables.invited_role]);

  return (
    <EmailShell
      locale={locale}
      preview={t('preview', variables)}
      category={t('category')}
      eyebrow={t('eyebrow')}
      heading={t('heading', variables)}
      body={t('body', { ...variables, invited_role })}
      action={t('action')}
      actionUrl={variables.invite_url}
      note={t('note')}
      fallbackUrl={variables.invite_url}
      disclaimer={t('disclaimer', variables)}
      shared={shared}
      helpUrl={variables.help_url}
      privacyUrl={variables.privacy_url}
      details={
        <DetailBox
          rows={[
            { label: t('detailWorkspace'), value: variables.workspace_name },
            { label: t('detailInvitedBy'), value: variables.inviter_name },
            { label: t('detailRole'), value: invited_role },
          ]}
        />
      }
    />
  );
};
