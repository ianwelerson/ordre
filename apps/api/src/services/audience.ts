import { LOCALE_PROPERTY, segmentId, topicId } from '#/config/audience.ts';
import { getResend } from '#/config/email.ts';
import { parseOutboxPayload } from '#/utils/outbox-payload.ts';
import type { Response as ResendResponse } from 'resend';

import { AUDIENCE_SEGMENTS, type AudienceSegment, type OutboxTopic } from '@ordre/core/enums';
import type { OutboxPayload, OutboxPayloadFor } from '@ordre/core/types';

export const syncAudienceContact = async (
  topic: OutboxTopic,
  payload: OutboxPayload,
  id: string
) => {
  if (topic !== 'contact:sync') {
    throw new Error(`Outbox row ${id} has no audience delivery for topic ${topic}`);
  }

  const parsed = parseOutboxPayload('audience:contact:sync', payload, id);
  const { to, variables } = parsed;

  await upsertContact(parsed);

  const desired = new Set<AudienceSegment>(variables.contact_segments);

  // Resend rejects a removal for a segment the contact is not in ("Audience not
  // found in contact's audience list"), so the current membership is read first
  // and only real changes are sent. That also makes an unchanged contact cost one
  // call instead of one per segment.
  const current = unwrap(await getResend().contacts.segments.list({ email: to }));
  const present = new Set(current.data.map((segment) => segment.id));

  // Every segment is decided on each sync, so the row's list is the whole truth
  // rather than a delta against whatever Resend currently holds. Nothing here is
  // a consent, so there is no membership the sync has to leave alone.
  for (const segment of AUDIENCE_SEGMENTS) {
    const options = { email: to, segmentId: segmentId(segment) };
    const isPresent = present.has(options.segmentId);

    if (desired.has(segment) && !isPresent) {
      unwrap(await getResend().contacts.segments.add(options));
    }

    if (!desired.has(segment) && isPresent) {
      unwrap(await getResend().contacts.segments.remove(options));
    }
  }

  // Opt-ins only, and only the sign-up producer ever sends any. Every other row
  // carries an empty list, because a topic is the contact's own preference: writing
  // it on a membership change would re-assert a subscription they may since have
  // turned off in Resend.
  if (variables.contact_topics.length > 0) {
    unwrap(
      await getResend().contacts.topics.update({
        email: to,
        topics: variables.contact_topics.map((name) => ({
          id: topicId(name),
          subscription: 'opt_in' as const,
        })),
      })
    );
  }
};

/** Returns a Resend response's data, throwing its error so the worker records the failure. */
const unwrap = <T>(result: ResendResponse<T>): T => {
  if (result.error) {
    throw result.error;
  }

  return result.data;
};

/**
 * Makes the contact exist and carry the current name and language.
 *
 * Nothing about subscription is set here. `unsubscribed` is the contact's own global
 * switch, so writing it would let a sign-up resurrect somebody who had turned every
 * broadcast off. The lookup keys on `not_found` rather than on whatever
 * `contacts.create` answers for a duplicate, because that name is in the SDK's own
 * error union.
 */
const upsertContact = async (payload: OutboxPayloadFor<'audience:contact:sync'>) => {
  const { to, locale, variables } = payload;

  const attributes = {
    firstName: variables.contact_first_name,
    lastName: variables.contact_last_name,
    properties: { [LOCALE_PROPERTY]: locale },
  };

  const existing = await getResend().contacts.get({ email: to });

  if (existing.error?.name === 'not_found') {
    unwrap(await getResend().contacts.create({ email: to, ...attributes }));

    return;
  }

  unwrap(existing);
  unwrap(await getResend().contacts.update({ email: to, ...attributes }));
};
