import { db } from '#/config/db.ts';
import { sql } from 'drizzle-orm';

import type { OutboxPayload } from '@ordre/core/types';

import { drain, startOutboxWorker, stopOutboxWorker, wakeOutboxWorker } from './outbox.worker.ts';

const { sendEmail, syncAudienceContact, log } = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  syncAudienceContact: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('#/services/email.ts', () => ({ sendEmail }));
vi.mock('#/services/audience.ts', () => ({ syncAudienceContact }));
vi.mock('#/config/logger.ts', () => ({ logger: { child: () => log } }));

const loggedWith = (level: 'info' | 'warn' | 'error', message: string) =>
  log[level].mock.calls.find(([, msg]) => msg === message)?.[0];

const resendError = (statusCode: number, name = 'application_error') => ({
  statusCode,
  name,
  message: 'resend said no',
});

const payload: OutboxPayload = {
  to: 'owner@example.com',
  locale: 'en',
  variables: {
    user_name: 'Ada',
    user_email: 'owner@example.com',
    dashboard_login_url: 'https://dashboard.test/login',
    help_url: 'https://help.test',
    privacy_url: 'https://privacy.test',
  },
};

const insertRow = async (overrides: Record<string, unknown> = {}) => {
  const {
    attempts = 0,
    nextAttemptAt = sql`now()`,
    claimedAt = null,
    processedAt = null,
    createdAt = sql`now()`,
    channel = 'email',
    topic = 'account:created',
    rowPayload = payload,
  } = overrides;

  const [row] = (
    await db.execute<{ id: string }>(sql`
      INSERT INTO outbox (channel, topic, payload, attempts, next_attempt_at, claimed_at, processed_at, created_at)
      VALUES (${channel}, ${topic}, ${JSON.stringify(rowPayload)}::jsonb,
              ${attempts}, ${nextAttemptAt}, ${claimedAt}, ${processedAt}, ${createdAt})
      RETURNING id
    `)
  ).rows;

  return row!.id;
};

const audiencePayload = {
  to: 'ada@example.com',
  locale: 'en',
  variables: {
    contact_first_name: 'Ada',
    contact_last_name: 'Lovelace',
    contact_segments: ['workspace-owner'],
    contact_topics: [],
  },
};

const readRow = async (id: string) => {
  const [row] = (
    await db.execute<{
      attempts: number;
      claimed_at: string | null;
      processed_at: string | null;
      last_error: string | null;
      backoff_seconds: string;
    }>(sql`
      SELECT attempts, claimed_at, processed_at, last_error,
             round(extract(epoch from (next_attempt_at - now()))) AS backoff_seconds
      FROM outbox WHERE id = ${id}
    `)
  ).rows;

  return { ...row!, backoffSeconds: Number(row!.backoff_seconds) };
};

describe('workers/outbox', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ id: 'resend-email-id' });
    syncAudienceContact.mockResolvedValue(undefined);
    await db.execute(sql`DELETE FROM outbox`);
  });

  afterEach(async () => {
    await stopOutboxWorker();
    await db.execute(sql`DELETE FROM outbox`);
  });

  describe('drain - success', () => {
    it('sends a due row and marks it processed', async () => {
      const id = await insertRow();

      await expect(drain()).resolves.toBe(1);

      const row = await readRow(id);
      expect(row.processed_at).not.toBeNull();
      expect(row.attempts).toBe(1);
    });

    it('hands the provider the topic, the payload and the row id as idempotency key', async () => {
      const id = await insertRow();

      await drain();

      expect(sendEmail).toHaveBeenCalledWith('account:created', payload, id);
    });

    it('leaves a processed row alone on the next drain', async () => {
      await insertRow();
      await drain();

      await expect(drain()).resolves.toBe(0);
      expect(sendEmail).toHaveBeenCalledOnce();
    });
  });

  describe('drain - failure classification', () => {
    it('consumes an attempt and backs off 4s on a transient 5xx', async () => {
      sendEmail.mockRejectedValueOnce(resendError(500));
      const id = await insertRow();

      await drain();

      const row = await readRow(id);
      expect(row.attempts).toBe(1);
      expect(row.processed_at).toBeNull();
      expect(row.backoffSeconds).toBe(4);
    });

    it('gives the attempt back and waits an hour on a 429', async () => {
      sendEmail.mockRejectedValueOnce(resendError(429, 'rate_limit_exceeded'));
      const id = await insertRow();

      await drain();

      const row = await readRow(id);
      expect(row.attempts).toBe(0);
      expect(row.backoffSeconds).toBe(3600);
    });

    it('lets a permanent 403 burn its attempts like any other failure', async () => {
      sendEmail.mockRejectedValueOnce(resendError(403, 'invalid_access'));
      const id = await insertRow({ attempts: 1 });

      await drain();

      const row = await readRow(id);
      expect(row.attempts).toBe(2);
      expect(row.backoffSeconds).toBe(16);
    });

    it('releases the claim so the row is retried rather than waiting out the timeout', async () => {
      sendEmail.mockRejectedValueOnce(resendError(500));
      const id = await insertRow();

      await drain();

      expect((await readRow(id)).claimed_at).toBeNull();
    });

    it('records a readable last_error for a provider error object', async () => {
      sendEmail.mockRejectedValueOnce(resendError(422, 'validation_error'));
      const id = await insertRow();

      await drain();

      expect((await readRow(id)).last_error).toBe('validation_error: resend said no');
    });

    it('records a readable last_error for a thrown Error', async () => {
      sendEmail.mockRejectedValueOnce(new Error('socket hang up'));
      const id = await insertRow();

      await drain();

      expect((await readRow(id)).last_error).toBe('socket hang up');
    });

    it('keeps draining the batch when one row fails', async () => {
      sendEmail.mockRejectedValueOnce(resendError(500));
      await insertRow();
      await insertRow();

      await expect(drain()).resolves.toBe(2);
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('drain - what the claim skips', () => {
    it('skips a row whose backoff has not elapsed', async () => {
      await insertRow({ nextAttemptAt: sql`now() + interval '1 hour'` });

      await expect(drain()).resolves.toBe(0);
    });

    it('skips a dead-lettered row at MAX_ATTEMPTS', async () => {
      await insertRow({ attempts: 5 });

      await expect(drain()).resolves.toBe(0);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('skips a row older than MAX_AGE even when it has attempts left', async () => {
      await insertRow({ attempts: 1, createdAt: sql`now() - interval '24 hours'` });

      await expect(drain()).resolves.toBe(0);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('still claims a row just inside MAX_AGE', async () => {
      await insertRow({ attempts: 1, createdAt: sql`now() - interval '22 hours'` });

      await expect(drain()).resolves.toBe(1);
      expect(sendEmail).toHaveBeenCalledOnce();
    });

    it('skips a row another worker claimed moments ago', async () => {
      await insertRow({ claimedAt: sql`now()` });

      await expect(drain()).resolves.toBe(0);
    });

    it('re-claims a row orphaned by a worker that died mid-send', async () => {
      const id = await insertRow({ claimedAt: sql`now() - interval '6 minutes'` });

      await expect(drain()).resolves.toBe(1);
      expect((await readRow(id)).processed_at).not.toBeNull();
    });
  });

  describe('drain - logging', () => {
    it('reports an idle sweep so a quiet worker is still visibly alive', async () => {
      await expect(drain()).resolves.toBe(0);

      expect(loggedWith('info', 'outbox drain: nothing due')).toMatchObject({ claimed: 0 });
    });

    it('summarises what a drain claimed, delivered and failed', async () => {
      await insertRow();
      await insertRow();
      sendEmail.mockRejectedValueOnce(resendError(500));

      await drain();

      expect(loggedWith('info', 'outbox drain complete')).toMatchObject({
        claimed: 2,
        delivered: 1,
        failed: 1,
        batchFull: false,
      });
    });

    it('warns on a retryable failure and escalates to error on the last attempt', async () => {
      sendEmail.mockRejectedValue(resendError(500));

      await insertRow({ attempts: 0 });
      await drain();
      expect(loggedWith('warn', 'outbox delivery failed, will retry')).toMatchObject({
        attempts: 1,
      });

      vi.clearAllMocks();
      sendEmail.mockRejectedValue(resendError(500));

      // attempts: 4 -> the claim takes it to 5 (MAX_ATTEMPTS), so this failure is
      // the one that dead-letters the row.
      await db.execute(sql`DELETE FROM outbox`);
      await insertRow({ attempts: 4 });
      await drain();

      expect(
        loggedWith(
          'error',
          'outbox row dead-lettered - giving up, this delivery will never be sent'
        )
      ).toMatchObject({ attempts: 5 });
    });
  });

  describe('drain - batching', () => {
    it('claims at most BATCH rows in one pass', async () => {
      await Promise.all(Array.from({ length: 12 }, () => insertRow()));

      await expect(drain()).resolves.toBe(10);
      await expect(drain()).resolves.toBe(2);
    });

    it('never delivers a row twice when drains overlap', async () => {
      await Promise.all(Array.from({ length: 4 }, () => insertRow()));

      const [first, second] = await Promise.all([drain(), drain()]);

      expect(first + second).toBe(4);
      expect(sendEmail).toHaveBeenCalledTimes(4);
    });
  });

  describe('channel routing', () => {
    const insertAudienceRow = () =>
      insertRow({ channel: 'audience', topic: 'contact:sync', rowPayload: audiencePayload });

    it('hands a row to the provider its channel names', async () => {
      await insertAudienceRow();

      await drain();

      expect(syncAudienceContact).toHaveBeenCalledWith(
        'contact:sync',
        expect.objectContaining({ to: 'ada@example.com' }),
        expect.any(String)
      );
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('drains both channels in one pass', async () => {
      await insertRow();
      await insertAudienceRow();

      await drain();

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(syncAudienceContact).toHaveBeenCalledTimes(1);
    });

    /** One row per channel is the point of the split. */
    it('leaves the email row delivered when the contact sync fails', async () => {
      const emailId = await insertRow();
      const audienceId = await insertAudienceRow();
      syncAudienceContact.mockRejectedValueOnce(resendError(500));

      await drain();

      expect((await readRow(emailId)).processed_at).not.toBeNull();
      expect((await readRow(audienceId)).processed_at).toBeNull();
    });

    it('clears a stale error once the row finally delivers', async () => {
      const id = await insertAudienceRow();
      syncAudienceContact.mockRejectedValueOnce(resendError(500));

      await drain();
      expect((await readRow(id)).last_error).not.toBeNull();

      await db.execute(sql`UPDATE outbox SET next_attempt_at = now() WHERE id = ${id}`);
      await drain();

      const row = await readRow(id);

      expect(row.processed_at).not.toBeNull();
      expect(row.last_error).toBeNull();
    });
  });

  describe('lifecycle', () => {
    it('ignores a wake when the worker was never started', async () => {
      await insertRow();

      wakeOutboxWorker();
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('drains on start and again on wake, then goes quiet after stop', async () => {
      await insertRow();

      startOutboxWorker();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(sendEmail).toHaveBeenCalledOnce();

      await insertRow();
      wakeOutboxWorker();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(sendEmail).toHaveBeenCalledTimes(2);

      await stopOutboxWorker();

      await insertRow();
      wakeOutboxWorker();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });

    it('resolves stopOutboxWorker only once the in-flight drain has finished', async () => {
      await insertRow();

      let sendResolved = false;
      sendEmail.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        sendResolved = true;
      });

      startOutboxWorker();
      await stopOutboxWorker();

      expect(sendResolved).toBe(true);
    });
  });
});
