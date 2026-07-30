import { sql } from 'drizzle-orm';
import { AsyncLocalStorage } from 'node:async_hooks';

import { db } from './db.ts';

// The type of the `tx` object Drizzle hands to a db.transaction(...) callback.
// We derive it instead of hand-writing it so it always matches Drizzle's version.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Holds the transaction for the in-flight request, isolated per async call chain.
const storage = new AsyncLocalStorage<Tx>();

/**
 * The database handle to use everywhere in the request path.
 *
 * Inside a request (i.e. within `runWithUser`), this is the transaction that has
 * `app.user_id` set, so queries run under RLS. Outside a request (startup, or a
 * query before the middleware runs) it falls back to the plain pooled `db`.
 */
export const getDb = (): Tx | typeof db => storage.getStore() ?? db;

/**
 * Runs `fn` with a database context bound to `userId`.
 *
 * It opens a transaction, pins `app.user_id` onto that transaction's connection
 * with SET LOCAL, and makes the transaction available through `getDb()` for the
 * whole async chain of `fn`. When `fn` finishes, the transaction commits and the
 * SET LOCAL value disappears - nothing leaks to the next request.
 */
export const runWithUser = <T>(userId: string, fn: () => Promise<T>): Promise<T> =>
  db.transaction(async (tx) => {
    // set_config(name, value, is_local=true) is the function form of `SET LOCAL`.
    // We pass userId as a bound parameter (${userId}) instead of string-building
    // the SQL, so there's no injection risk.
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);

    return storage.run(tx, fn);
  });
