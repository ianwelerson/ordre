import type { WorkspaceLocationRow, WorkspaceMemberRow } from '#/types/db.ts';

import {
  countActiveOwnersForUpdate,
  findMember,
  findMembers,
  suspendMember,
  toMemberBase,
  toMemberResponse,
  updateMember,
} from './member.utils.ts';

// A single mutable db double, driven per test. `getDb()` resolves to it.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspaceMember: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    transaction: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('#/config/db-context.ts', () => ({ getDb: () => mockDb }));

/**
 * Runs `db.transaction(cb)` against a `tx` double so `suspendMember`'s
 * in-transaction logic (owner count + update) actually executes.
 *
 * @param owners - Rows returned by the locked active-owner count `select`.
 * @param updated - Rows returned by the `update(...).returning()`.
 */
let capturedSet: Record<string, unknown> | undefined;

const mockTransaction = (owners: unknown[], updated: unknown[]) => {
  capturedSet = undefined;
  mockDb.transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      select: () => ({
        from: () => ({ where: () => ({ for: () => Promise.resolve(owners) }) }),
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => {
          capturedSet = values;

          return { where: () => ({ returning: () => Promise.resolve(updated) }) };
        },
      }),
    })
  );
};

/** `update(...).set(...).where(...).returning()` resolving with `rows`. */
const mockUpdate = (rows: unknown[]) => {
  mockDb.update.mockReturnValue({
    set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }),
  });
};

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const LOCATION_ID = '44444444-4444-4444-8444-444444444444';

/** A workspace_member row, as Drizzle returns it (Date timestamps). */
const memberRow = (overrides: Partial<WorkspaceMemberRow> = {}): WorkspaceMemberRow => ({
  id: MEMBER_ID,
  userId: USER_ID,
  workspaceId: WORKSPACE_ID,
  displayName: 'Casey',
  title: 'Manager',
  role: 'member',
  status: 'active',
  phone: '555-0100',
  locale: 'en',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-02-02T00:00:00.000Z'),
  ...overrides,
});

/** A workspace_location row, as embedded under a member's `locations`. */
const locationRow = (overrides: Partial<WorkspaceLocationRow> = {}): WorkspaceLocationRow => ({
  id: LOCATION_ID,
  workspaceId: WORKSPACE_ID,
  name: 'Main',
  address: null,
  longitude: null,
  latitude: null,
  phone: null,
  email: null,
  isDefault: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('controllers/workspace/member.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toMemberBase', () => {
    it('maps every column and serializes timestamps to ISO strings', () => {
      expect(toMemberBase(memberRow())).toEqual({
        id: MEMBER_ID,
        userId: USER_ID,
        displayName: 'Casey',
        title: 'Manager',
        role: 'member',
        status: 'active',
        phone: '555-0100',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
        locale: 'en',
      });
    });

    it('never embeds locations', () => {
      expect(toMemberBase(memberRow())).not.toHaveProperty('locations');
    });
  });

  describe('toMemberResponse', () => {
    it('omits `locations` when the relation was not loaded', () => {
      expect(toMemberResponse(memberRow())).not.toHaveProperty('locations');
    });

    it('embeds `locations` (as base shapes) when `locations` is loaded', () => {
      // Only the join row's `location` matters to the mapper; cast past its other columns.
      const result = toMemberResponse({
        ...memberRow(),
        locations: [{ location: locationRow() }],
      } as Parameters<typeof toMemberResponse>[0]);

      expect(result.locations).toHaveLength(1);
      expect(result.locations?.[0]).toMatchObject({ id: LOCATION_ID, isDefault: true });
      // Locations are embedded as the flat base shape (no nested members).
      expect(result.locations?.[0]).not.toHaveProperty('members');
    });

    it('embeds an empty `locations` array when the member has no assignments', () => {
      const result = toMemberResponse({ ...memberRow(), locations: [] });

      expect(result.locations).toEqual([]);
    });
  });

  describe('countActiveOwnersForUpdate', () => {
    it('returns the number of locked owner rows', async () => {
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({ for: () => Promise.resolve([{ id: 'a' }, { id: 'b' }]) }),
          }),
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(await countActiveOwnersForUpdate(tx as any, WORKSPACE_ID)).toBe(2);
    });
  });

  describe('suspendMember', () => {
    it('suspends a plain member and resets role/phone', async () => {
      mockTransaction([], [memberRow({ status: 'suspended', role: 'member', phone: null })]);

      const result = await suspendMember(memberRow());

      expect(result).toMatchObject({ status: 'suspended' });
      expect(capturedSet).toEqual({ status: 'suspended', role: 'member', phone: null });
    });

    it('does not run the owner count for a non-owner', async () => {
      const forUpdate = vi.fn(() => Promise.resolve([]));
      mockDb.transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
        cb({
          select: () => ({ from: () => ({ where: () => ({ for: forUpdate }) }) }),
          update: () => ({
            set: () => ({ where: () => ({ returning: () => Promise.resolve([memberRow()]) }) }),
          }),
        })
      );

      await suspendMember(memberRow({ role: 'member' }));

      expect(forUpdate).not.toHaveBeenCalled();
    });

    it('refuses with LAST_OWNER when the target is the sole active owner', async () => {
      mockTransaction([{ id: MEMBER_ID }], []);

      const result = await suspendMember(memberRow({ role: 'owner', status: 'active' }));

      expect(result).toBe('LAST_OWNER');
    });

    it('suspends an owner when another active owner remains', async () => {
      mockTransaction(
        [{ id: MEMBER_ID }, { id: 'second-owner' }],
        [memberRow({ role: 'member', status: 'suspended' })]
      );

      const result = await suspendMember(memberRow({ role: 'owner', status: 'active' }));

      expect(result).toMatchObject({ status: 'suspended' });
    });

    it('returns undefined when the update matches no row', async () => {
      mockTransaction([], []);

      expect(await suspendMember(memberRow())).toBeUndefined();
    });
  });

  describe('updateMember', () => {
    it('returns the updated row', async () => {
      mockUpdate([memberRow({ displayName: 'Renamed' })]);

      expect(await updateMember(WORKSPACE_ID, MEMBER_ID, { displayName: 'Renamed' })).toMatchObject(
        {
          displayName: 'Renamed',
        }
      );
    });

    it('returns undefined when no row matches within the workspace', async () => {
      mockUpdate([]);

      expect(await updateMember(WORKSPACE_ID, MEMBER_ID, { displayName: 'X' })).toBeUndefined();
    });
  });

  describe('read helpers pass their result through', () => {
    it('findMember returns the row the query resolves', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow());

      expect(await findMember(WORKSPACE_ID, MEMBER_ID)).toMatchObject({ id: MEMBER_ID });
    });

    it('findMembers returns the rows the query resolves', async () => {
      mockDb.query.workspaceMember.findMany.mockResolvedValueOnce([memberRow(), memberRow()]);

      expect(await findMembers(WORKSPACE_ID)).toHaveLength(2);
    });
  });
});
