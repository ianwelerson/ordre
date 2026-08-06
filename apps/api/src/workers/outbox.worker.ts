/**
 * Transactional outbox delivery worker.
 *
 * Claim and send are separate phases on purpose: the claim is a single statement
 * that commits immediately, so no pooled connection is held across the provider's
 * HTTP call. Delivery is therefore at-least-once, which is why every send passes
 * the row id as the provider's idempotency key.
 */
import { db } from '#/config/db.ts';
import { logger } from '#/config/logger.ts';
import { sendEmail } from '#/services/email.ts';
import type { OutboxRow } from '#/types/db.ts';
import { sql } from 'drizzle-orm';

import type { OutboxChannel, OutboxTopic } from '@ordre/core/enums';
import type { OutboxPayload } from '@ordre/core/types';

/**
 * Safety net only - delivery latency comes from {@link wakeOutboxWorker}. Neon's
 * free plan suspends after five idle minutes and bills for being awake, so a
 * faster sweep keeps the compute up 24/7 and exhausts the monthly budget against
 * an empty table.
 */
const SWEEP_MS = 30 * 60 * 1000;

const BATCH = 10;

/**
 * Attempts before a row is dead-lettered (left unprocessed, never claimed again).
 * Five keeps the whole retry sequence inside Resend's 24h idempotency window, so
 * a redelivery can't turn into a duplicate email.
 */
const MAX_ATTEMPTS = 5;

/**
 * Hard age cap on a claimable row, and the other half of the idempotency
 * guarantee above.
 *
 * {@link MAX_ATTEMPTS} alone doesn't bound a row's lifetime: the rate-limited path
 * in {@link recordFailure} hands the attempt back, so a persistently throttled row
 * can retry hourly forever. Past Resend's 24h window the idempotency key stops
 * being honoured, and a redelivery of a send that actually succeeded is a duplicate
 * email. Rows older than this stop being claimed and dead-letter instead.
 */
const MAX_AGE = sql`interval '23 hours'`;

type ClaimedRow = Pick<OutboxRow, 'id' | 'channel' | 'topic' | 'payload' | 'attempts'>;

/**
 * Delivers one row, throwing on failure so {@link recordFailure} can classify it.
 * Takes the topic because the provider resolves its own template from it.
 */
type Provider = (topic: OutboxTopic, payload: OutboxPayload, id: string) => Promise<unknown>;

/**
 * Keyed by channel: the column decides which provider gets the row, and the
 * provider decides what to render from the topic.
 */
const providers: Record<OutboxChannel, Provider> = {
  email: sendEmail,
};

const log = logger.child({ worker: 'outbox' });

/** Renders an unknown throwable for `last_error`: provider errors are plain objects, not `Error`s. */
const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const { name, message } = error as { name?: unknown; message?: unknown };

    if (typeof message === 'string') {
      return typeof name === 'string' ? `${name}: ${message}` : message;
    }

    return JSON.stringify(error);
  }

  return String(error);
};

const getStatus = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const { statusCode } = error as { statusCode?: unknown };

  return typeof statusCode === 'number' ? statusCode : undefined;
};

/**
 * Releases a failed row for a later attempt.
 *
 * A `429` is the account being throttled (Resend's free plan caps at 100
 * emails/day), not this message's fault, so the attempt is handed back and the row
 * waits an hour - a valid email must never dead-letter because of a busy
 * afternoon. Anything else keeps the attempt consumed at claim time and backs off
 * `power(4, attempts)` seconds: 4 / 16 / 64 / 256. `attempts` reads the row's
 * pre-update value, which already counts this failure.
 */
const recordFailure = async (row: ClaimedRow, error: unknown): Promise<void> => {
  const rateLimited = getStatus(error) === 429;

  await db.execute(sql`
    UPDATE outbox
    SET last_error = ${formatError(error)},
        claimed_at = NULL,
        updated_at = now(),
        attempts = attempts - ${rateLimited ? 1 : 0},
        next_attempt_at = now() + ${
          rateLimited ? sql`interval '1 hour'` : sql`power(4, attempts) * interval '1 second'`
        }
    WHERE id = ${row.id}
  `);

  /**
   * `row.attempts` is the post-claim count, so this failure is already included:
   * reaching MAX_ATTEMPTS here means the claim filter will never pick the row up
   * again. Logged at error because nothing else will ever mention it - a
   * dead-lettered row is an email that silently never arrives.
   */
  const deadLettered = !rateLimited && row.attempts >= MAX_ATTEMPTS;

  const context = {
    err: error,
    outboxId: row.id,
    topic: row.topic,
    attempts: row.attempts,
    rateLimited,
  };

  if (deadLettered) {
    log.error(context, 'outbox row dead-lettered - giving up, this delivery will never be sent');

    return;
  }

  log.warn(context, 'outbox delivery failed, will retry');
};

/**
 * Claims a batch of due rows and delivers them.
 *
 * Uses the pooled `db`, never `getDb()`: outside a request `getDb()` falls back to
 * the same pool and would appear to work, then silently join a caller's
 * transaction the day something drains from inside one.
 *
 * @returns How many rows were claimed. A full {@link BATCH} means there may be more.
 */
export const drain = async (): Promise<number> => {
  //  * FOR UPDATE SKIP LOCKED: concurrent workers take different rows instead of
  //    blocking, which is what makes multiple API replicas safe.
  //  * attempts is incremented at claim time, so a crash mid-send still counts and
  //    a poison message can't retry forever.
  //  * the claimed_at cutoff re-claims rows orphaned by a crashed or redeployed
  //    worker.
  //  * AS MATERIALIZED is load-bearing, not decoration. As `WHERE id IN (SELECT
  //    ... LIMIT n)` this plans as a semi-join that re-runs the subquery per
  //    candidate row, so every execution locks another n and the batch cap is
  //    silently ignored. Materializing runs the selection exactly once.
  const startedAt = Date.now();

  const claimed = await db.execute<ClaimedRow>(sql`
    WITH due AS MATERIALIZED (
      SELECT id FROM outbox
      WHERE processed_at IS NULL
        AND attempts < ${MAX_ATTEMPTS}
        AND created_at > now() - ${MAX_AGE}
        AND next_attempt_at <= now()
        AND (claimed_at IS NULL OR claimed_at < now() - interval '5 minutes')
      ORDER BY next_attempt_at
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH}
    )
    UPDATE outbox SET claimed_at = now(), attempts = attempts + 1, updated_at = now()
    FROM due
    WHERE outbox.id = due.id
    RETURNING outbox.id, outbox.channel, outbox.topic, outbox.payload, outbox.attempts
  `);

  if (claimed.rows.length === 0) {
    log.info({ claimed: 0, durationMs: Date.now() - startedAt }, 'outbox drain: nothing due');

    return 0;
  }

  let delivered = 0;
  let failed = 0;

  for (const row of claimed.rows) {
    try {
      await providers[row.channel](row.topic, row.payload, row.id);

      await db.execute(
        sql`UPDATE outbox SET processed_at = now(), updated_at = now() WHERE id = ${row.id}`
      );

      delivered += 1;
    } catch (error) {
      failed += 1;
      await recordFailure(row, error);
    }
  }

  log.info(
    {
      claimed: claimed.rows.length,
      delivered,
      failed,
      durationMs: Date.now() - startedAt,
      batchFull: claimed.rows.length === BATCH,
    },
    'outbox drain complete'
  );

  return claimed.rows.length;
};

let timer: NodeJS.Timeout | undefined;
let inFlight: Promise<void> | undefined;
let wakeRequested = false;

// Starts true: "never started" and "stopped" are the same state, and waking either
// one has to be a no-op. That is also what keeps the worker inert under Vitest,
// where the entrypoint that calls `startOutboxWorker` is never imported but
// producers - and therefore `wakeOutboxWorker` - do run.
let stopped = true;

const run = async (): Promise<void> => {
  do {
    // Cleared before draining, not after, so a wake that lands mid-pass schedules
    // another pass instead of being lost until the next sweep.
    wakeRequested = false;

    try {
      // Keep going while batches come back full, so a burst doesn't trickle out one
      // batch per sweep.
      while ((await drain()) === BATCH && !stopped) {
        continue;
      }
    } catch (error) {
      log.error({ err: error }, 'outbox drain failed');
    }
  } while (wakeRequested && !stopped);
};

/**
 * Recursive `setTimeout`, not `setInterval`: `setInterval` doesn't await an async
 * callback, so a slow tick would overlap the next and a throw would surface as an
 * unhandled rejection. The `inFlight` guard keeps it to one drain at a time.
 */
const loop = (): void => {
  if (stopped || inFlight) {
    return;
  }

  inFlight = run().finally(() => {
    inFlight = undefined;

    if (stopped) {
      return;
    }

    clearTimeout(timer);
    // unref so the sweep timer never keeps the process alive on its own.
    timer = setTimeout(loop, SWEEP_MS).unref();
  });
};

/**
 * Wakes the worker now. Call it once a transaction that wrote outbox rows has
 * *committed* - waking any earlier runs the claim against rows nobody else can see
 * yet, and the row then waits for the sweep. Only latency depends on this; the
 * sweep delivers everything either way.
 */
export const wakeOutboxWorker = (): void => {
  if (stopped) {
    return;
  }

  wakeRequested = true;
  loop();
};

/** Starts the sweep loop with an immediate first drain. Wire this into the entrypoint, not `server.ts`. */
export const startOutboxWorker = (): void => {
  stopped = false;

  log.info({ sweepMs: SWEEP_MS, batch: BATCH, maxAttempts: MAX_ATTEMPTS }, 'outbox worker started');

  loop();
};

/** Stops the loop, resolving once the in-flight drain is done so shutdown can await it before `pool.end()`. */
export const stopOutboxWorker = (): Promise<void> => {
  stopped = true;
  clearTimeout(timer);

  log.info({ drainInFlight: inFlight !== undefined }, 'outbox worker stopping');

  return inFlight ?? Promise.resolve();
};
