import type { EmailMessages } from '../../types/email.ts';

/**
 * Copy for every transactional email, keyed by the block the template renders.
 *
 * Placeholders are ICU and name variables the delivery declares in
 * `OUTBOX_PAYLOAD_SCHEMAS`, so a template can only interpolate something its
 * payload actually carries.
 *
 * Typed as `EmailMessages`: adding a message in core breaks this file, in every
 * locale, until someone writes words for it.
 */
export const emails: EmailMessages = {
  shared: {
    help: 'Help center',
    privacy: 'Privacy',
  },
  accountCreated: {
    subject: 'Welcome to Ordre',
    preview: 'Get started with your Ordre account and share job updates with clients.',
    category: 'Account',
    eyebrow: 'Welcome to the workshop',
    heading: 'Welcome to Ordre, {user_name}',
    body: 'Your account is all set. Ordre gives every job a private status board you share with a single link - clients follow the work in real time, with no app to download and no account to create. Just a link.',
    action: 'Log in to Ordre',
    note: 'You signed in as {user_email}.',
    disclaimer:
      "You're receiving this because an Ordre account was created with {user_email}. If this wasn't you, you can safely ignore this email - the account stays locked until a password is set.",
    stepsLabel: 'Getting started',
    steps: [
      {
        title: 'Set up your workspace',
        body: "Name your shop, pick your trade, and invite your team when you're ready.",
      },
      {
        title: 'Create your first board',
        body: 'Choose a template that fits the job and fill in the details. It takes a minute.',
      },
      {
        title: 'Share the link',
        body: 'Send it by SMS, email, or WhatsApp. Post updates as the work moves - your client just watches it happen.',
      },
    ],
  },
  verifyEmail: {
    subject: 'Confirm your email address',
    preview: 'Confirm your email address to finish setting up your Ordre account.',
    category: 'Verification',
    eyebrow: 'One quick check',
    heading: 'Confirm your email address.',
    body: "Let's make sure this inbox is really yours. Click the button below to verify {user_email} and finish setting up your Ordre account.",
    action: 'Verify email address',
    note: "This link expires in 1 hour. If the button doesn't work, copy and paste this URL into your browser:",
    disclaimer:
      "You're receiving this because someone entered {user_email} when signing up for Ordre. Didn't try to sign up? You can safely ignore this email - the address won't be verified and no account will be created without this step.",
  },
  resetPassword: {
    subject: 'Reset your Ordre password',
    preview: 'Reset your Ordre password to get back into your account.',
    category: 'Security',
    eyebrow: 'Password reset',
    heading: 'Reset your password.',
    body: 'We received a request to reset the password for {user_email}. Click the button below to choose a new password and get back into your Ordre account.',
    action: 'Reset password',
    note: "This link expires in 1 hour and can only be used once. If the button doesn't work, copy and paste this URL into your browser:",
    disclaimer:
      "You're receiving this because a password reset was requested for {user_email} on Ordre. Didn't request one? You can safely ignore this email - your password won't change until you create a new one.",
  },
  workspaceCreated: {
    subject: '{workspace_name} is live',
    preview: 'Get started by creating your first board and sharing it with a client.',
    category: 'Workspace',
    eyebrow: 'Workspace created',
    heading: '{workspace_name} is live.',
    body: 'Your workspace is set up and ready to go. Create your first board, pick a template that fits the job, and share the link - no app, no account for your client, just a page they can follow in real time.',
    action: 'Create your first board',
    note: 'Or head straight to your dashboard:',
    disclaimer:
      "You're receiving this because {owner_email} created the workspace {workspace_name} on Ordre.",
    detailWorkspace: 'Workspace',
    detailIndustry: 'Industry',
    detailPlan: 'Plan',
    detailOwner: 'Owner',
    stepsLabel: "What's next",
    steps: [
      {
        title: 'Create your first board',
        body: 'Choose a template that fits the job and fill in the details. It takes a minute.',
      },
      {
        title: 'Invite your team',
        body: 'Add the people who run jobs with you from Settings, Members. Everyone works from the same boards.',
      },
      {
        title: 'Share the link',
        body: 'Send it by SMS, email, or WhatsApp. Post updates as the work moves - your client just watches it happen.',
      },
    ],
  },
  inviteCreated: {
    subject: 'Join {workspace_name} on Ordre',
    preview:
      '{inviter_name} invited you to join {workspace_name} on Ordre. Accept to start collaborating on boards.',
    category: 'Invitation',
    eyebrow: "You've been invited",
    heading: 'Join {workspace_name} on Ordre.',
    body: '{inviter_name} has invited you to join their workspace as {invited_role}. Ordre gives every job a private status board you share with a single link - accept the invite to start collaborating on boards with the team.',
    action: 'Accept invitation',
    note: "This invitation expires in 7 days. If the button doesn't work, copy and paste this URL into your browser:",
    disclaimer:
      "You're receiving this because {inviter_name} invited {invitee_email} to a workspace on Ordre. If you weren't expecting this, you can safely ignore this email - no account is created until you accept.",
    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleMember: 'Member',
    detailWorkspace: 'Workspace',
    detailInvitedBy: 'Invited by',
    detailRole: 'Your role',
  },
};
