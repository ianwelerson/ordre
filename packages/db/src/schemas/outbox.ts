import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { OUTBOX_CHANNELS, OUTBOX_TOPICS } from '@ordre/core/enums';
import type { OutboxPayload } from '@ordre/core/types';

export const outboxChannel = pgEnum('outbox_channel', OUTBOX_CHANNELS);
export const outboxTopic = pgEnum('outbox_topic', OUTBOX_TOPICS);

/**
 * Transactional outbox: one row per *delivery*, written in the same transaction
 * as the business data it describes.
 *
 * `channel` routes the row to a provider and `topic` names the business event;
 * together they resolve the template at send time, which is why `payload` holds
 * only the recipient and variables.
 *
 * Deliberately NOT under RLS. The worker connects as `ordre_app` with no
 * `app.user_id` set, so any policy would evaluate against a NULL user, return
 * zero rows, and the queue would look permanently empty while silently sending
 * nothing.
 */
export const outbox = pgTable(
  'outbox',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    channel: outboxChannel('channel').notNull(),
    topic: outboxTopic('topic').notNull(),
    payload: jsonb('payload').$type<OutboxPayload>().notNull(),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).defaultNow().notNull(),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // Partial index: only unprocessed rows are ever claimed, so drains stay cheap
    // no matter how many delivered rows accumulate.
    index('outbox_pending_idx')
      .on(t.nextAttemptAt)
      .where(sql`${t.processedAt} IS NULL`),
  ]
);
