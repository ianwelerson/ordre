import { z } from 'zod';

import { OUTBOX_PAYLOAD_SCHEMAS } from '../schemas/outbox.ts';

/**
 * One deliverable thing, named `<channel>:<topic>`. Derived from the payload
 * registry so that stays the only place a delivery is declared.
 */
export type OutboxDelivery = keyof typeof OUTBOX_PAYLOAD_SCHEMAS;

/** What one delivery renders from: recipient plus exactly its variables. */
export type OutboxPayloadFor<D extends OutboxDelivery> = z.infer<
  (typeof OUTBOX_PAYLOAD_SCHEMAS)[D]
>;

/** What the `payload` column holds - any delivery's payload. */
export type OutboxPayload = { [D in OutboxDelivery]: OutboxPayloadFor<D> }[OutboxDelivery];

/**
 * The variables one delivery requires, so a producer can be checked against
 * `<channel>:<topic>` without naming a template.
 */
export type OutboxVariablesFor<D extends OutboxDelivery> = OutboxPayloadFor<D>['variables'];

/** A delivery the email channel carries, so the template registry covers exactly those. */
export type EmailDelivery = Extract<OutboxDelivery, `email:${string}`>;
