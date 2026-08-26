import type { WorkspaceMemberRole } from '../enums/workspace.ts';
import type { OutboxDelivery } from './outbox.ts';

/**
 * The copy every message renders, on top of the variables its payload carries.
 *
 * Values may contain ICU placeholders naming any variable that delivery declares,
 * for example `Welcome to Ordre, {user_name}`.
 */
export type EmailCommonCopy = {
  /** The subject line. Resend rejects a send with an empty one. */
  subject: string;
  /** The preheader, shown by most clients beside the subject in the inbox list. */
  preview: string;
  /** The category shown opposite the wordmark in the header, for example `Account`. */
  category: string;
  /** The small uppercase label above the headline. */
  eyebrow: string;
  heading: string;
  body: string;
  /** The label on the call to action button. */
  action: string;
  /** The line under the button, explaining expiry or naming the account. */
  note: string;
  /** The "you are receiving this because" line under the card. */
  disclaimer: string;
};

/**
 * The numbered list an onboarding message ends with.
 *
 * A list rather than numbered fields, so a message is free to walk through two
 * steps or five. The number beside each is its position, generated at render.
 */
export type EmailStepsCopy = {
  stepsLabel: string;
  steps: { title: string; body: string }[];
};

/** Row labels for the summary box, which only some messages show. */
export type EmailWorkspaceDetailCopy = {
  detailWorkspace: string;
  detailIndustry: string;
  detailPlan: string;
  detailOwner: string;
};

/**
 * The display name for each role, keyed `role<Role>`.
 *
 * The payload carries the role as the enum value the database stores, which is
 * English and lower case. A message names the role to the person being invited,
 * so the words belong here rather than in the row.
 *
 * Derived from `WORKSPACE_MEMBER_ROLES`, so adding a role breaks every locale
 * until it has a name.
 */
export type EmailRoleCopy = {
  [R in WorkspaceMemberRole as `role${Capitalize<R>}`]: string;
};

export type EmailInviteDetailCopy = EmailRoleCopy & {
  detailWorkspace: string;
  detailInvitedBy: string;
  detailRole: string;
};

/** Copy that every message renders, regardless of which event produced it. */
export type EmailSharedCopy = {
  help: string;
  privacy: string;
};

/**
 * Every email's copy in one locale, keyed by the block a template renders.
 *
 * Deliberately not uniform: only the onboarding messages carry steps, and only
 * two carry a summary box, so a template can never read a field its own message
 * does not define.
 *
 * Adding a message breaks this in every locale until someone writes the words.
 */
export type EmailMessages = {
  shared: EmailSharedCopy;
  accountCreated: EmailCommonCopy & EmailStepsCopy;
  verifyEmail: EmailCommonCopy;
  resetPassword: EmailCommonCopy;
  workspaceCreated: EmailCommonCopy & EmailStepsCopy & EmailWorkspaceDetailCopy;
  inviteCreated: EmailCommonCopy & EmailInviteDetailCopy;
};

/** One block of copy, named. Derived from the bundle so the two cannot drift. */
export type EmailCopyKey = Exclude<keyof EmailMessages, 'shared'>;

/**
 * The copy block a delivery renders from.
 *
 * This is what stops a template being paired with another message's words: the
 * registry in `@ordre/email` types its `copyKey` as this, so the compiler rejects
 * the pairing rather than a test catching it after the fact.
 */
export type EmailCopyKeyFor<D extends OutboxDelivery> = {
  'email:account:created': 'accountCreated';
  'email:account:verify-email': 'verifyEmail';
  'email:account:reset-password': 'resetPassword';
  'email:workspace:created': 'workspaceCreated';
  'email:invite:created': 'inviteCreated';
}[D];

/** The copy field naming one role, for a template resolving a payload's role value. */
export type EmailRoleField = keyof EmailRoleCopy;
