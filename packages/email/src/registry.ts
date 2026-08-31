import type { ReactElement } from 'react';

import type { EmailCopyKeyFor, EmailDelivery } from '@ordre/core/types';

import { AccountCreatedEmail } from './templates/account-created.tsx';
import { InviteCreatedEmail } from './templates/invite-created.tsx';
import { ResetPasswordEmail } from './templates/reset-password.tsx';
import { VerifyEmail } from './templates/verify-email.tsx';
import { WorkspaceCreatedEmail } from './templates/workspace-created.tsx';
import type { TemplateProps } from './types.ts';

/** What one delivery renders with: its copy block and the component that lays it out. */
export type EmailTemplate<D extends EmailDelivery> = {
  copyKey: EmailCopyKeyFor<D>;
  Component: (props: TemplateProps<D>) => ReactElement;
};

/**
 * Every delivery mapped to the template that renders it.
 *
 * `copyKey` is typed `EmailCopyKeyFor<D>`, so a template cannot be paired with
 * another message's words - the compiler rejects it.
 *
 * The mapped type makes a delivery without a template a compile error, and
 * `Component`'s props are that delivery's own variables, so a template reading a
 * variable its schema does not declare will not compile either.
 */
export const TEMPLATES: { [D in EmailDelivery]: EmailTemplate<D> } = {
  'email:account:created': { copyKey: 'accountCreated', Component: AccountCreatedEmail },
  'email:account:verify-email': { copyKey: 'verifyEmail', Component: VerifyEmail },
  'email:account:reset-password': { copyKey: 'resetPassword', Component: ResetPasswordEmail },
  'email:workspace:created': { copyKey: 'workspaceCreated', Component: WorkspaceCreatedEmail },
  'email:invite:created': { copyKey: 'inviteCreated', Component: InviteCreatedEmail },
};
