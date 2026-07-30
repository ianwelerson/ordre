import { sql } from 'drizzle-orm';

import { getDb, runWithUser } from './db-context.ts';

describe('db-context', () => {
  it('exposes app.user_id inside runWithUser and unsets it outside', async () => {
    await runWithUser('11111111-1111-4111-8111-111111111111', async () => {
      const result = await getDb().execute(sql`SELECT current_setting('app.user_id', true) AS uid`);
      // Inside the context, the value is our id.
      expect(result.rows[0]?.uid).toBe('11111111-1111-4111-8111-111111111111');
    });

    // Outside the context, it's back to empty (nothing leaked).
    const after = await getDb().execute(sql`SELECT current_setting('app.user_id', true) AS uid`);
    expect(after.rows[0]?.uid ?? '').toBe('');
  });
});
