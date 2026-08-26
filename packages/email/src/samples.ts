import type { OutboxDelivery, OutboxVariablesFor } from '@ordre/core/types';

const LINKS = {
  help_url: 'https://ordre.app/help',
  privacy_url: 'https://ordre.app/privacy',
};

/**
 * Realistic values for the preview server, one set per delivery.
 *
 * Kept apart from the test fixtures, which are generated from the schemas and use
 * deliberately findable placeholders. These exist to be looked at, so they read
 * like a real message.
 */
export const SAMPLES: { [D in OutboxDelivery]: OutboxVariablesFor<D> } = {
  'email:account:created': {
    user_name: 'Ada Lovelace',
    user_email: 'ada@example.com',
    dashboard_login_url: 'https://dashboard.ordre.app/login',
    ...LINKS,
  },
  'email:account:verify-email': {
    user_email: 'ada@example.com',
    verify_url: 'https://api.ordre.app/verify?token=9f2c1a',
    ...LINKS,
  },
  'email:account:reset-password': {
    user_email: 'ada@example.com',
    reset_url: 'https://dashboard.ordre.app/set-password?token=9f2c1a',
    ...LINKS,
  },
  'email:workspace:created': {
    workspace_name: 'Atelier Nord',
    workspace_industry: 'Jewelry',
    workspace_plan: 'Free',
    owner_email: 'ada@example.com',
    dashboard_url: 'https://dashboard.ordre.app',
    ...LINKS,
  },
  'email:invite:created': {
    workspace_name: 'Atelier Nord',
    inviter_name: 'Ada Lovelace',
    invitee_email: 'grace@example.com',
    invited_role: 'member',
    invite_url: 'https://dashboard.ordre.app/invite/9f2c1a',
    ...LINKS,
  },
};
