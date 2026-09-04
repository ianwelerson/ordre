import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * The override for one feature switch, keyed by the feature's name.
 *
 * `key` is `text`, so a new switch needs a seed row and no migration. The union
 * in `@ordre/core/enums` is what decides which keys mean anything.
 */
export const feature = pgTable('feature', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
