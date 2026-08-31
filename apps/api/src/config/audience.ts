import { env } from '#env';

import { type AudienceSegment, type AudienceTopic } from '@ordre/core/enums';

/**
 * The Resend contact property carrying a contact's language, so a broadcast can be
 * segmented by it. Contacts reference a property by key rather than by id.
 */
export const LOCALE_PROPERTY = 'locale';

/**
 * Segment ids for this environment.
 *
 * They belong to the account `RESEND_API_KEY` opens.
 */
const SEGMENT_IDS = {
  'all-accounts': env.RESEND_SEGMENT_ALL_ACCOUNTS,
  'workspace-owner': env.RESEND_SEGMENT_WORKSPACE_OWNER,
  'workspace-member': env.RESEND_SEGMENT_WORKSPACE_MEMBER,
} satisfies Record<AudienceSegment, string | undefined>;

/**
 * Topic ids for this environment.
 *
 * They belong to the account `RESEND_API_KEY` opens.
 */
const TOPIC_IDS = {
  'product-news': env.RESEND_TOPIC_PRODUCT_NEWS,
  'workspace-updates': env.RESEND_TOPIC_WORKSPACE_UPDATES,
} satisfies Record<AudienceTopic, string | undefined>;

/**
 * Resolves a segment name to the Resend id for this environment.
 *
 * Throws rather than returning undefined so a missing id is a delivery failure the
 * outbox records and retries, the same reasoning as the deferred Resend client.
 */
export const segmentId = (segment: AudienceSegment): string => {
  const id = SEGMENT_IDS[segment];

  if (!id) {
    throw new Error(`No Resend segment id configured for "${segment}"`);
  }

  return id;
};

/** Resolves a topic name to the Resend id for this environment. */
export const topicId = (topic: AudienceTopic): string => {
  const id = TOPIC_IDS[topic];

  if (!id) {
    throw new Error(`No Resend topic id configured for "${topic}"`);
  }

  return id;
};
