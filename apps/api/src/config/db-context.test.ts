import { sql } from 'drizzle-orm';

import { afterCommit, getDb, runWithUser } from './db-context.ts';

const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('db-context', () => {
  describe('afterCommit', () => {
    it('runs queued callbacks once the transaction has committed', async () => {
      const callback = vi.fn();

      await runWithUser(USER_ID, async () => {
        afterCommit(callback);

        // Still inside the transaction: a reader on another connection cannot see
        // this request's writes yet, which is the whole reason for the delay.
        expect(callback).not.toHaveBeenCalled();
      });

      expect(callback).toHaveBeenCalledOnce();
    });

    it('drops queued callbacks when the transaction rolls back', async () => {
      const callback = vi.fn();

      await expect(
        runWithUser(USER_ID, async () => {
          afterCommit(callback);

          throw new Error('handler failed');
        })
      ).rejects.toThrow('handler failed');

      // Nothing committed, so there is nothing to react to.
      expect(callback).not.toHaveBeenCalled();
    });

    it('runs the callback inline when there is no request transaction', () => {
      const callback = vi.fn();

      afterCommit(callback);

      expect(callback).toHaveBeenCalledOnce();
    });

    it('runs callbacks in the order they were queued', async () => {
      const calls: string[] = [];

      await runWithUser(USER_ID, async () => {
        afterCommit(() => calls.push('first'));
        afterCommit(() => calls.push('second'));
      });

      expect(calls).toEqual(['first', 'second']);
    });
  });

  it('exposes app.user_id inside runWithUser and unsets it outside', async () => {
    await runWithUser(USER_ID, async () => {
      const result = await getDb().execute(sql`SELECT current_setting('app.user_id', true) AS uid`);
      // Inside the context, the value is our id.
      expect(result.rows[0]?.uid).toBe(USER_ID);
    });

    // Outside the context, it's back to empty (nothing leaked).
    const after = await getDb().execute(sql`SELECT current_setting('app.user_id', true) AS uid`);
    expect(after.rows[0]?.uid ?? '').toBe('');
  });
});
