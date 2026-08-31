import type { DbHandle } from '#/config/db-context.ts';

import { audienceSegmentsForSelf, audienceStateForMember } from './audience.ts';

/** A `select(...).from(...).where(...)` resolving with `rows`. */
const handleReturning = (rows: { role: string }[]) =>
  ({
    select: () => ({ from: () => ({ where: () => Promise.resolve(rows) }) }),
  }) as unknown as DbHandle;

/** An `execute(...)` resolving with `rows`, as `app_member_audience_state` answers. */
const handleExecuting = (rows: unknown[]) =>
  ({ execute: () => Promise.resolve({ rows }) }) as unknown as DbHandle;

const MEMBER_ID = '22222222-2222-4222-8222-222222222222';

describe('utils/audience', () => {
  describe('audienceSegmentsForSelf', () => {
    /**
     * A contact exists because an account does, so this one never depends on a
     * membership. It is also the segment a broadcast to everybody targets, since
     * Resend requires one.
     */
    it('reports all-accounts for a user with no active membership', async () => {
      expect(await audienceSegmentsForSelf(handleReturning([]), 'user-1')).toEqual([
        'all-accounts',
      ]);
    });

    it('reports workspace-owner for an owner', async () => {
      expect(await audienceSegmentsForSelf(handleReturning([{ role: 'owner' }]), 'user-1')).toEqual(
        ['all-accounts', 'workspace-owner']
      );
    });

    it('reports workspace-member for an admin, who is not an owner', async () => {
      expect(await audienceSegmentsForSelf(handleReturning([{ role: 'admin' }]), 'user-1')).toEqual(
        ['all-accounts', 'workspace-member']
      );
    });

    /**
     * The two are independent: the list describes the contact across every
     * workspace, so owning one and belonging to another lands in both.
     */
    it('reports both for someone who owns one workspace and belongs to another', async () => {
      const segments = await audienceSegmentsForSelf(
        handleReturning([{ role: 'owner' }, { role: 'member' }]),
        'user-1'
      );

      expect(segments).toEqual(['all-accounts', 'workspace-owner', 'workspace-member']);
    });
  });

  describe('audienceStateForMember', () => {
    it('returns null when the function answers nothing', async () => {
      expect(await audienceStateForMember(handleExecuting([]), MEMBER_ID)).toBeNull();
    });

    it('maps the row onto the payload the producer needs', async () => {
      const state = await audienceStateForMember(
        handleExecuting([
          {
            email: 'ada@example.com',
            first_name: 'Ada',
            last_name: 'Lovelace',
            is_owner: true,
            is_member: false,
          },
        ]),
        MEMBER_ID
      );

      expect(state).toEqual({
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        segments: ['all-accounts', 'workspace-owner'],
      });
    });

    it('keeps only all-accounts once the last active membership is gone', async () => {
      const state = await audienceStateForMember(
        handleExecuting([
          {
            email: 'ada@example.com',
            first_name: 'Ada',
            last_name: '',
            is_owner: false,
            is_member: false,
          },
        ]),
        MEMBER_ID
      );

      expect(state?.segments).toEqual(['all-accounts']);
    });
  });
});
