/**
 * Canonical value lists for the transactional outbox. `OUTBOX_CHANNELS` and
 * `OUTBOX_TOPICS` back Postgres enums, so adding a value to either is a migration.
 */

/**
 * Delivery transports. One row per channel, so a Twilio failure never re-sends an
 * email that already went out.
 */
export const OUTBOX_CHANNELS = ['email'] as const;
export type OutboxChannel = (typeof OUTBOX_CHANNELS)[number];

/**
 * The business event that produced the row. Carried as a column so outstanding and
 * dead-lettered rows can be grouped without a jsonb scan, and because `<channel>`
 * and `<topic>` together name what gets rendered (see `OUTBOX_PAYLOAD_SCHEMAS`).
 */
export const OUTBOX_TOPICS = [
  'account:created',
  'account:verify-email',
  'account:reset-password',
  'workspace:created',
  'invite:created',
] as const;
export type OutboxTopic = (typeof OUTBOX_TOPICS)[number];

/**
 * Variables every message carries regardless of event, and which every template
 * therefore renders: the two footer links.
 *
 * The producer never passes these - `pushToOutbox` fills them in - so they are
 * listed separately from the per-event vocabulary below and both sides derive
 * from this one list. A link only some messages point at, `dashboard_url` among
 * them, belongs in that vocabulary instead, because a delivery has to opt in to
 * a variable it actually renders.
 */
export const OUTBOX_DEFAULT_VARIABLES = ['help_url', 'privacy_url'] as const;
export type OutboxDefaultVariable = (typeof OUTBOX_DEFAULT_VARIABLES)[number];

/**
 * The full vocabulary a template may render. `OUTBOX_PAYLOAD_SCHEMAS` picks a
 * subset per delivery, so this list is the shared dictionary rather than the
 * contract - a variable is only required where a template asks for it.
 */
export const OUTBOX_VARIABLES = [
  'dashboard_url',
  'dashboard_login_url',
  'workspace_name',
  'workspace_industry',
  'workspace_plan',
  'owner_email',
  'inviter_name',
  'invitee_email',
  'invited_role',
  'invite_url',
  'user_name',
  'user_email',
  'verify_url',
  'reset_url',
  ...OUTBOX_DEFAULT_VARIABLES,
] as const;
export type OutboxVariable = (typeof OUTBOX_VARIABLES)[number];
