import { useTranslations } from 'next-intl';

import { WorkspaceInvitePreview } from '@ordre/core/types';
import { Avatar, Badge, type BadgeProps, Card, Typography } from '@ordre/ui/components';

import { bold } from './chunks';

interface InviteWorkspaceProps {
  invite: WorkspaceInvitePreview;
}

/**
 * Badge tone per role, from the brand colour for an owner down to neutral for a
 * member.
 */
const ROLE_TONES = {
  owner: 'accent',
  admin: 'info',
  member: 'neutral',
} satisfies Record<WorkspaceInvitePreview['role'], BadgeProps['tone']>;

/**
 * Shows what the invite grants: the workspace, who sent it, and the role. Shared
 * by all three invite screens, which ask the reader the same question.
 */
export const InviteWorkspace = ({ invite }: InviteWorkspaceProps) => {
  const t = useTranslations('Invite');

  return (
    <Card variant="quiet">
      <div className="flex items-start gap-4">
        <Avatar label={invite.workspaceName} image={invite.workspaceLogo ?? undefined} tone="ink" />
        <div className="flex flex-1 flex-col gap-1">
          <Typography tag="p" tone="default" variant="caption">
            {invite.invitedByName
              ? t.rich('invitedBy', {
                  name: invite.invitedByName,
                  workspace: invite.workspaceName,
                  b: bold,
                })
              : t.rich('invitedByUnknown', { workspace: invite.workspaceName, b: bold })}
          </Typography>
          <Badge className="w-fit" tone={ROLE_TONES[invite.role]}>
            {t(`roles.${invite.role}`)}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
