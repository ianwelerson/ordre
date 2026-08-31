/**
 * The Resend segments a contact can belong to.
 *
 * A segment is internal grouping, not consent: each one is a fact about our own
 * tables, recomputed on every sync, and every one of them is safe to remove somebody
 * from. What a contact has agreed to receive lives in {@link AUDIENCE_TOPICS}, which
 * is the split Resend's own model asks for.
 *
 * Names, never provider ids: a queued outbox row references the segment by name, so
 * a segment recreated in Resend keeps every pending row deliverable.
 */
export const AUDIENCE_SEGMENTS = ['all-accounts', 'workspace-owner', 'workspace-member'] as const;

export type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number];

/**
 * The Resend topics a contact can be opted into.
 *
 * A topic is a kind of email together with the recipient's preference for it, so a
 * broadcast scoped to one reaches only the people who want it. A sync may **add** an
 * opt-in and must never remove one: the preference belongs to the contact, and
 * re-asserting it would undo an unsubscribe they made in Resend.
 *
 * Each topic carries a default chosen when it was created, which Resend does not
 * allow changing afterwards. `product-news` defaults to opt-out, so it means nothing
 * until somebody ticks the box on sign-up, which is what makes it consent.
 * `workspace-updates` defaults to opt-in, because it carries information about a
 * workspace the person already belongs to, and nothing here ever writes it.
 */
export const AUDIENCE_TOPICS = ['product-news', 'workspace-updates'] as const;

export type AudienceTopic = (typeof AUDIENCE_TOPICS)[number];
