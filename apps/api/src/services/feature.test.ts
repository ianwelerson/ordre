import { db } from '#/config/db.ts';
import { logger } from '#/config/logger.ts';

import { FEATURES } from '@ordre/core/enums';

import { clearFeatureCache, getFeatures, isFeatureEnabled } from './feature.ts';

vi.mock('#/config/db.ts', () => ({ db: { select: vi.fn() } }));
vi.mock('#/config/logger.ts', () => ({ logger: { error: vi.fn() } }));

const select = vi.mocked(db.select);

/** Mirrors `FAILURE_TTL_MS` in the service, which is not exported. */
const FAILURE_WINDOW_MS = 2_000;

/** Every switch closed, which is what `FEATURE_DEFAULTS` resolves to. */
const allClosed = Object.fromEntries(FEATURES.map((key) => [key, false]));

type Row = { key: string; enabled: boolean };

/**
 * Answers every read with `rows`.
 *
 * The service reads the whole table in one query, so a mock only has to satisfy
 * `.from()`; the cast keeps the rest of Drizzle's builder out of the test.
 */
const tableHolds = (...rows: Row[]) => {
  select.mockReturnValue({ from: () => Promise.resolve(rows) } as never);
};

/** Queues one read that rejects, standing in for an unreachable database. */
const readFailsOnce = (error = new Error('connection terminated')) => {
  select.mockReturnValueOnce({ from: () => Promise.reject(error) } as never);
};

/** Queues one read that resolves with `rows`. */
const readSucceedsOnce = (...rows: Row[]) => {
  select.mockReturnValueOnce({ from: () => Promise.resolve(rows) } as never);
};

describe('services/feature', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearFeatureCache();
  });

  afterEach(() => {
    // The cases that drive the failure window install fake timers, so real ones
    // are restored here for the cases that wait on a `setTimeout`.
    vi.useRealTimers();
  });

  describe('getFeatures', () => {
    it('falls back to the defaults when the table is empty', async () => {
      tableHolds();

      await expect(getFeatures()).resolves.toEqual(allClosed);
    });

    it('applies an override over the default', async () => {
      tableHolds({ key: 'registration', enabled: true });

      await expect(getFeatures()).resolves.toEqual({ ...allClosed, registration: true });
    });

    it('answers every known key even when the table holds only one row', async () => {
      tableHolds({ key: 'login', enabled: true });

      expect(Object.keys(await getFeatures()).sort()).toEqual([...FEATURES].sort());
    });

    it('ignores a row whose key is not a known feature', async () => {
      tableHolds({ key: 'legacy-switch', enabled: true });

      await expect(getFeatures()).resolves.toEqual(allClosed);
    });

    it('reuses the resolved set within the cache window', async () => {
      tableHolds({ key: 'registration', enabled: true });

      await getFeatures();
      await getFeatures();

      expect(select).toHaveBeenCalledTimes(1);
    });

    it('reads the table again once the cache has been dropped', async () => {
      tableHolds({ key: 'registration', enabled: true });

      await getFeatures();
      clearFeatureCache();
      await getFeatures();

      expect(select).toHaveBeenCalledTimes(2);
    });

    it('closes every feature when the read throws', async () => {
      readFailsOnce();

      await expect(getFeatures()).resolves.toEqual(allClosed);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'feature.read_failed' }),
        expect.any(String)
      );
    });

    it('holds a failure only briefly, then retries the table', async () => {
      vi.useFakeTimers();

      readFailsOnce();
      readSucceedsOnce({ key: 'registration', enabled: true });

      await expect(getFeatures()).resolves.toMatchObject({ registration: false });

      // Inside the failure window the cached defaults answer, so a database that
      // is down is not re-read once per request.
      await expect(getFeatures()).resolves.toMatchObject({ registration: false });
      expect(select).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(FAILURE_WINDOW_MS + 1);

      await expect(getFeatures()).resolves.toMatchObject({ registration: true });
      expect(select).toHaveBeenCalledTimes(2);
    });

    it('holds a failure for far less time than a success', async () => {
      vi.useFakeTimers();

      readFailsOnce();
      tableHolds({ key: 'registration', enabled: true });

      await getFeatures();

      vi.advanceTimersByTime(FAILURE_WINDOW_MS + 1);
      await getFeatures();

      // A success now holds for the full window, where the failure did not.
      vi.advanceTimersByTime(FAILURE_WINDOW_MS + 1);
      await getFeatures();

      expect(select).toHaveBeenCalledTimes(2);
    });

    it('serves concurrent callers from one read', async () => {
      select.mockReturnValue({
        from: () =>
          new Promise((resolve) => {
            setTimeout(() => resolve([{ key: 'registration', enabled: true }]), 10);
          }),
      } as never);

      const results = await Promise.all(Array.from({ length: 50 }, () => getFeatures()));

      // Without a shared in-flight read this is 50 queries against a pool of ten,
      // reachable unauthenticated through `GET /v1/features`.
      expect(select).toHaveBeenCalledTimes(1);
      expect(results.every((r) => r.registration)).toBe(true);
    });

    it('lets the next caller retry after a failed read has settled', async () => {
      readFailsOnce();
      tableHolds({ key: 'registration', enabled: true });

      await getFeatures();
      // The in-flight slot is released on failure as well as success, so the
      // service cannot wedge on a rejected promise.
      clearFeatureCache();

      await expect(getFeatures()).resolves.toMatchObject({ registration: true });
    });
  });

  describe('isFeatureEnabled', () => {
    it('reads one key out of the resolved set', async () => {
      tableHolds({ key: 'workspace-creation', enabled: true });

      await expect(isFeatureEnabled('workspace-creation')).resolves.toBe(true);
      await expect(isFeatureEnabled('registration')).resolves.toBe(false);
    });

    it('reports a switch the table has turned off', async () => {
      tableHolds({ key: 'login', enabled: false });

      await expect(isFeatureEnabled('login')).resolves.toBe(false);
    });
  });
});
