import { sql } from 'drizzle-orm';
import { AsyncLocalStorage } from 'node:async_hooks';

import { db } from './db.ts';

// The type of the `tx` object Drizzle hands to a db.transaction(...) callback.
// We derive it instead of hand-writing it so it always matches Drizzle's version.
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// The transaction for the in-flight request plus anything waiting on its commit,
// isolated per async call chain.
type Context = { tx: Tx; afterCommit: (() => void)[] };

const storage = new AsyncLocalStorage<Context>();

/**
 * A handle queries run through: the request transaction when there is one, the
 * pooled connection when there is not. Named so a helper can take one without
 * caring which it was given.
 */
export type DbHandle = Tx | typeof db;

/**
 * The database handle to use everywhere in the request path.
 *
 * Inside a request (i.e. within `runWithUser`), this is the transaction that has
 * `app.user_id` set, so queries run under RLS. Outside a request (startup, or a
 * query before the middleware runs) it falls back to the plain pooled `db`.
 */
export const getDb = (): DbHandle => storage.getStore()?.tx ?? db;

/**
 * Queues `fn` to run once the request transaction commits, or runs it immediately
 * when there is no request transaction (a script, or a Better Auth hook, where the
 * caller's write was its own autocommitted statement).
 *
 * For anything that reacts to a write from *outside* the transaction - waking the
 * outbox worker, say - this is the only correct moment. Run it any earlier and the
 * reader is on a different pooled connection that cannot see the uncommitted row.
 */
export const afterCommit = (fn: () => void) => {
  const store = storage.getStore();

  if (!store) {
    fn();

    return;
  }

  store.afterCommit.push(fn);
};

/**
 * Runs `fn` with a database context bound to `userId`.
 *
 * It opens a transaction, pins `app.user_id` onto that transaction's connection
 * with SET LOCAL, and makes the transaction available through `getDb()` for the
 * whole async chain of `fn`. When `fn` finishes, the transaction commits and the
 * SET LOCAL value disappears - nothing leaks to the next request.
 */
export const runWithUser = async <T>(userId: string, fn: () => Promise<T>): Promise<T> => {
  const context: Context = { tx: undefined as never, afterCommit: [] };

  const result = await db.transaction(async (tx) => {
    // set_config(name, value, is_local=true) is the function form of `SET LOCAL`.
    // We pass userId as a bound parameter (${userId}) instead of string-building
    // the SQL, so there's no injection risk.
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);

    context.tx = tx;

    return storage.run(context, fn);
  });

  // Only reached on COMMIT: a rollback rejects above, so the callbacks are dropped
  // along with the writes they were reacting to.
  for (const callback of context.afterCommit) {
    callback();
  }

  return result;
};
