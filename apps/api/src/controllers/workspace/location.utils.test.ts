import type { WorkspaceLocationRow, WorkspaceMemberRow } from '#/types/db.ts';

import {
  assignMemberToLocation,
  createLocation,
  findDefaultLocation,
  findLocation,
  findLocations,
  locationInWorkspace,
  toLocationBase,
  toLocationResponse,
  unassignMemberFromLocation,
  updateLocation,
} from './location.utils.ts';

// A single mutable db double, driven per test. `getDb()` resolves to it, so the
// query-builder helpers below run against the mock rather than a real database.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspaceLocation: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('#/config/db-context.ts', () => ({ getDb: () => mockDb }));

/** `insert(...).values(...).returning()` resolving with `rows`. */
const mockInsert = (rows: unknown[]) => {
  mockDb.insert.mockReturnValue({ values: () => ({ returning: () => Promise.resolve(rows) }) });
};

/** `update(...).set(...).where(...).returning()` resolving with `rows`. */
const mockUpdate = (rows: unknown[]) => {
  mockDb.update.mockReturnValue({
    set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }),
  });
};

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const LOCATION_ID = '22222222-2222-4222-8222-222222222222';
const MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const USER_ID = '44444444-4444-4444-8444-444444444444';

/** A workspace_location row, as Drizzle returns it (Date timestamps). */
const locationRow = (overrides: Partial<WorkspaceLocationRow> = {}): WorkspaceLocationRow => ({
  id: LOCATION_ID,
  workspaceId: WORKSPACE_ID,
  name: 'Main',
  address: '1 Market St',
  latitude: 4.56,
  longitude: 1.23,
  phone: '555-0100',
  email: 'main@ordre.app',
  isDefault: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-02-02T00:00:00.000Z'),
  ...overrides,
});

/** A workspace_member row, as embedded under a location's `members`. */
const memberRow = (overrides: Partial<WorkspaceMemberRow> = {}): WorkspaceMemberRow => ({
  id: MEMBER_ID,
  userId: USER_ID,
  workspaceId: WORKSPACE_ID,
  displayName: 'Casey',
  title: 'Manager',
  role: 'member',
  status: 'active',
  phone: null,
  locale: 'en',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('controllers/workspace/location.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toLocationBase', () => {
    it('maps every column and serializes timestamps to ISO strings', () => {
      const result = toLocationBase(locationRow());

      expect(result).toEqual({
        id: LOCATION_ID,
        name: 'Main',
        address: '1 Market St',
        latitude: 4.56,
        longitude: 1.23,
        phone: '555-0100',
        email: 'main@ordre.app',
        isDefault: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
      });
    });

    it('never embeds members', () => {
      expect(toLocationBase(locationRow())).not.toHaveProperty('members');
    });
  });

  describe('toLocationResponse', () => {
    it('omits `members` when the relation was not loaded', () => {
      const result = toLocationResponse(locationRow());

      expect(result).not.toHaveProperty('members');
    });

    it('embeds `members` (as base shapes) when `members` is loaded', () => {
      // Only the join row's `member` matters to the mapper; cast past its other columns.
      const result = toLocationResponse({
        ...locationRow(),
        members: [{ member: memberRow() }, { member: memberRow({ id: 'other-member' }) }],
      } as Parameters<typeof toLocationResponse>[0]);

      expect(result.members).toHaveLength(2);
      expect(result.members?.[0]).toMatchObject({ id: MEMBER_ID, userId: USER_ID });
      // Members are embedded as the flat base shape (no nested locations).
      expect(result.members?.[0]).not.toHaveProperty('locations');
    });

    it('embeds an empty `members` array when the location has no assignments', () => {
      const result = toLocationResponse({ ...locationRow(), members: [] });

      expect(result.members).toEqual([]);
    });
  });

  describe('createLocation', () => {
    it('returns the created row', async () => {
      mockInsert([locationRow({ name: 'Second' })]);

      const result = await createLocation(WORKSPACE_ID, { name: 'Second' });

      expect(result).toMatchObject({ name: 'Second' });
    });

    it('returns undefined when the insert yields no row', async () => {
      mockInsert([]);

      expect(await createLocation(WORKSPACE_ID, { name: 'Second' })).toBeUndefined();
    });
  });

  describe('updateLocation', () => {
    it('returns the updated row', async () => {
      mockUpdate([locationRow({ name: 'Renamed' })]);

      const result = await updateLocation(WORKSPACE_ID, LOCATION_ID, { name: 'Renamed' });

      expect(result).toMatchObject({ name: 'Renamed' });
    });

    it('returns undefined when no row matches within the workspace', async () => {
      mockUpdate([]);

      expect(await updateLocation(WORKSPACE_ID, LOCATION_ID, { name: 'Renamed' })).toBeUndefined();
    });
  });

  describe('assignMemberToLocation', () => {
    it('returns the created assignment row', async () => {
      const assignment = {
        id: 'a1',
        memberId: MEMBER_ID,
        locationId: LOCATION_ID,
      };
      mockInsert([assignment]);

      expect(await assignMemberToLocation(LOCATION_ID, MEMBER_ID)).toEqual(assignment);
    });

    it('inserts the member and location under the right columns', async () => {
      const values = vi.fn(() => ({ returning: () => Promise.resolve([{}]) }));
      mockDb.insert.mockReturnValue({ values });

      await assignMemberToLocation(LOCATION_ID, MEMBER_ID);

      expect(values).toHaveBeenCalledWith({
        memberId: MEMBER_ID,
        locationId: LOCATION_ID,
      });
    });

    it('returns undefined when the insert yields no row', async () => {
      mockInsert([]);

      expect(await assignMemberToLocation(LOCATION_ID, MEMBER_ID)).toBeUndefined();
    });
  });

  describe('unassignMemberFromLocation', () => {
    it('resolves after issuing the scoped delete', async () => {
      const where = vi.fn(() => Promise.resolve(undefined));
      mockDb.delete.mockReturnValue({ where });

      await expect(unassignMemberFromLocation(LOCATION_ID, MEMBER_ID)).resolves.toBeUndefined();
      expect(where).toHaveBeenCalledOnce();
    });
  });

  describe('read helpers pass their result through', () => {
    it('findLocation returns the row the query resolves', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());

      expect(await findLocation(WORKSPACE_ID, LOCATION_ID)).toMatchObject({ id: LOCATION_ID });
    });

    it('findDefaultLocation returns the row the query resolves', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(
        locationRow({ isDefault: true })
      );

      expect(await findDefaultLocation(WORKSPACE_ID)).toMatchObject({ isDefault: true });
    });

    it('findLocations returns the rows the query resolves', async () => {
      mockDb.query.workspaceLocation.findMany.mockResolvedValueOnce([locationRow()]);

      expect(await findLocations(WORKSPACE_ID)).toHaveLength(1);
    });
  });

  describe('locationInWorkspace', () => {
    it('returns true when the location belongs to the workspace', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce({ id: LOCATION_ID });

      expect(await locationInWorkspace(WORKSPACE_ID, LOCATION_ID)).toBe(true);
    });

    it('returns false when the location is not in the workspace', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(undefined);

      expect(await locationInWorkspace(WORKSPACE_ID, LOCATION_ID)).toBe(false);
    });
  });
});
