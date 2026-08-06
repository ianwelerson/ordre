import { afterCommit, type getDb } from '#/config/db-context.ts';
import { urls } from '#/config/urls.ts';
import { wakeOutboxWorker } from '#/workers/outbox.worker.ts';

import type { OutboxChannel, OutboxDefaultVariable, OutboxTopic } from '@ordre/core/enums';
import type { OutboxPayload, OutboxVariablesFor } from '@ordre/core/types';
import * as schema from '@ordre/db/schemas';

/**
 * Either database handle a producer can write through: the request transaction
 * from `getDb()`, or the nested `tx` of a controller that opened one.
 */
type OutboxDb = ReturnType<typeof getDb>;

/**
 * The same for every message, so producers don't repeat them.
 *
 * Read off `urls` rather than written out here: these were literals pointing at
 * production, which meant every email sent from dev or a preview deploy linked
 * users into the live app. The `Record<OutboxDefaultVariable, string>` annotation
 * still makes a new default variable a compile error until it is given a value.
 *
 * These are frozen into the row at write time, so a queued row keeps the origins
 * that were configured when it was produced.
 */
const DEFAULT_VARIABLES: Record<OutboxDefaultVariable, string> = {
  base_url: urls.base,
  dashboard_url: urls.dashboard,
  dashboard_login_url: urls.dashboardLogin,
  help_url: urls.help,
  privacy_url: urls.privacy,
};

/**
 * A queued delivery, described by the business event. `variables` is checked
 * against `<channel>:<topic>`, minus the defaults above, so a missing or
 * misspelled one is a compile error at the call site - as is a pair the channel
 * has no delivery for.
 */
type PushToOutboxInput<C extends OutboxChannel, T extends OutboxTopic> = {
  channel: C;
  topic: T;
  to: string;
  variables: Omit<OutboxVariablesFor<`${C}:${T}`>, OutboxDefaultVariable>;
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
export const pushToOutbox = async <C extends OutboxChannel, T extends OutboxTopic>(
  transaction: OutboxDb,
  { channel, topic, to, variables }: PushToOutboxInput<C, T>
) => {
  await transaction.insert(schema.outbox).values({
    channel,
    topic,
    // The cast is the one thing the compiler can't do here: with `C` and `T` still
    // generic it can't prove this object is a member of the payload union, even
    // though `PushToOutboxInput` just constrained it to exactly that.
    payload: { to, variables: { ...DEFAULT_VARIABLES, ...variables } } as OutboxPayload,
  });

  // Awaited above on purpose. Inside a request this only queues the callback, so
  // the order wouldn't matter - but outside one `afterCommit` runs it inline, and
  // waking before the insert has committed drains an empty table.
  afterCommit(wakeOutboxWorker);
};
