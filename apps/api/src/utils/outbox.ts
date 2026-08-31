import { afterCommit, type DbHandle } from '#/config/db-context.ts';
import { getRequestLocale } from '#/config/request-context.ts';
import { urls } from '#/config/urls.ts';
import { wakeOutboxWorker } from '#/workers/outbox.worker.ts';

import type { Locale, OutboxChannel, OutboxDefaultVariable } from '@ordre/core/enums';
import type { OutboxDelivery, OutboxPayload, OutboxVariablesFor } from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

/**
 * The topics one channel actually has a delivery for.
 *
 * Distributes over `OutboxDelivery` through the `D` parameter, so the union is
 * filtered rather than reduced to `never`. A topic no longer implies every
 * channel, so this is what makes `channel: 'audience'` with an email-only topic a
 * compile error at the call site.
 */
type OutboxTopicFor<C extends OutboxChannel, D = OutboxDelivery> = D extends `${C}:${infer T}`
  ? T
  : never;

/**
 * The variables a channel adds to every row it carries, so producers do not repeat
 * them. The email footer's two links belong to email; a contact operation has no
 * template and takes none.
 */
const DEFAULT_VARIABLES: Record<OutboxChannel, Partial<Record<OutboxDefaultVariable, string>>> = {
  email: { help_url: urls.help, privacy_url: urls.privacy },
  audience: {},
};

/**
 * A queued delivery, described by the business event. `variables` is checked
 * against `<channel>:<topic>`, minus the defaults above, so a missing or
 * misspelled one is a compile error at the call site - as is a pair the channel
 * has no delivery for.
 */
type PushToOutboxInput<C extends OutboxChannel, T extends OutboxTopicFor<C>> = {
  channel: C;
  topic: T;
  to: string;
  variables: Omit<OutboxVariablesFor<Extract<`${C}:${T}`, OutboxDelivery>>, OutboxDefaultVariable>;
  /**
   * The language to render the message in. Defaults to the locale negotiated for
   * the in-flight request.
   *
   * Pass it explicitly when the recipient's language is known better than the
   * request's - an invite, where the row is produced by the inviter but read by
   * someone else, is the case that matters.
   */
  locale?: Locale;
  /**
   * Hold the row back until this moment, rather than sending as soon as the
   * transaction commits. Defaults to immediately.
   *
   * This is `next_attempt_at`, the same column the retry backoff writes, because
   * it already means exactly this: do not attempt before. The worker's claim
   * filter and its index are both on it, so a held row costs nothing to skip.
   *
   * Keep it well inside the worker's `MAX_AGE` (23 hours). That cap is applied
   * to `created_at`, not to this, so a row scheduled beyond it would come due
   * only after it had already aged out of the claim filter - queued, never sent,
   * and never failed either.
   */
  sendAfter?: Date;
};

/**
 * Queues one delivery, in the caller's transaction, and wakes the worker once that
 * transaction commits - so delivery is a Resend round trip rather than a wait for
 * the next sweep.
 *
 * Pass the handle explicitly: inside a nested `getDb().transaction(...)` the
 * insert belongs to that `tx`, or the row survives a rollback of the block that
 * produced it. Everywhere else `getDb()` is already the request transaction.
 *
 * There is no runtime validation here on purpose. The payload is built from a
 * literal in our own code and checked at compile time against `<channel>:<topic>`,
 * which is strictly stronger than a parse. The channel service re-parses with that
 * same delivery's schema before rendering.
 */
export const pushToOutbox = async <C extends OutboxChannel, T extends OutboxTopicFor<C>>(
  transaction: DbHandle,
  { channel, topic, to, variables, locale, sendAfter }: PushToOutboxInput<C, T>
) => {
  await transaction.insert(schema.outbox).values({
    channel,
    topic,
    // The cast is the one thing the compiler can't do here: with `C` and `T` still
    // generic it can't prove this object is a member of the payload union, even
    // though `PushToOutboxInput` just constrained it to exactly that.
    payload: {
      to,
      locale: locale ?? getRequestLocale(),
      variables: { ...DEFAULT_VARIABLES[channel], ...variables },
    } as OutboxPayload,
    // Left to the column default when absent, so an immediate row still reads
    // `now()` from the database's clock rather than this process's.
    ...(sendAfter && { nextAttemptAt: sendAfter }),
  });

  // A row that is not due yet is nothing to wake for: the drain would claim
  // nothing and go back to sleep. It waits for the sweep instead, which is why a
  // held row's delivery is `sendAfter` plus up to one sweep interval.
  if (sendAfter && sendAfter.getTime() > Date.now()) {
    return;
  }

  // Awaited above on purpose. Inside a request this only queues the callback, so
  // the order wouldn't matter - but outside one `afterCommit` runs it inline, and
  // waking before the insert has committed drains an empty table.
  afterCommit(wakeOutboxWorker);
};
