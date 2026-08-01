import type { WorkspaceMemberContext } from '#/types/context.ts';

import {
  workspaceLocationCreate,
  workspaceLocationDelete,
  workspaceLocationGetAll,
  workspaceLocationGetById,
  workspaceLocationMemberAssign,
  workspaceLocationMemberUnassign,
  workspaceLocationSetDefault,
  workspaceLocationUpdate,
} from './location.controller.ts';

// A single mutable db double, driven per test. `getDb()` (used by both the
// controller and location.utils/member.utils) resolves to it, so mocking one
// module covers every query path exercised here.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspaceLocation: { findFirst: vi.fn(), findMany: vi.fn() },
      workspaceMember: { findFirst: vi.fn() },
    },
    transaction: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('#/config/db-context.ts', () => ({ getDb: () => mockDb }));
vi.mock('#/config/logger.ts', () => ({ logger: { error: vi.fn() } }));

/** `update(...).set(...).where(...).returning()` resolving with `rows`. */
const mockUpdate = (rows: unknown[]) => {
  mockDb.update.mockReturnValue({
    set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }),
  });
};

/** `insert(...).values(...).returning()` resolving with `rows`. */
const mockInsert = (rows: unknown[]) => {
  mockDb.insert.mockReturnValue({ values: () => ({ returning: () => Promise.resolve(rows) }) });
};

/** `insert(...).values(...).returning()` rejecting with `error`. */
const mockInsertReject = (error: unknown) => {
  mockDb.insert.mockReturnValue({ values: () => ({ returning: () => Promise.reject(error) }) });
};

/** `delete(...).where(...)` resolving (the unassign helper awaits without `.returning()`). */
const mockDelete = () => {
  mockDb.delete.mockReturnValue({ where: () => Promise.resolve(undefined) });
};

/** A Postgres unique-violation error for the `(member, location)` assignment index. */
const uniqueViolation = Object.assign(new Error('duplicate key'), {
  code: '23505',
  constraint: 'workspace_member_location_unique',
});

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const LOCATION_ID = '22222222-2222-4222-8222-222222222222';
const DEFAULT_LOCATION_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const USER_ID = '55555555-5555-4555-8555-555555555555';
const member: WorkspaceMemberContext = { id: 'member-1', workspaceId: WORKSPACE_ID, role: 'owner' };

/** A workspace_member row, as Drizzle returns it (Date timestamps). */
const memberRow = (overrides: Record<string, unknown> = {}) => ({
  id: MEMBER_ID,
  userId: USER_ID,
  workspaceId: WORKSPACE_ID,
  displayName: null,
  title: null,
  role: 'member',
  status: 'active',
  phone: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  members: [],
  ...overrides,
});

/** A workspace_location row, as Drizzle returns it (Date timestamps). */
const locationRow = (overrides: Record<string, unknown> = {}) => ({
  id: LOCATION_ID,
  workspaceId: WORKSPACE_ID,
  name: 'Main',
  address: null,
  longitude: null,
  latitude: null,
  phone: null,
  email: null,
  isDefault: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('controllers/workspace/location', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('workspaceLocationGetAll', () => {
    it('returns 200 with the mapped locations', async () => {
      mockDb.query.workspaceLocation.findMany.mockResolvedValueOnce([
        locationRow({ id: DEFAULT_LOCATION_ID, isDefault: true }),
        locationRow(),
      ]);

      const result = await workspaceLocationGetAll(member);

      expect(result.status).toBe(200);
      expect(result.body).toHaveLength(2);
      // Timestamps are serialized to ISO strings in the response shape.
      expect(result.body).toMatchObject([{ isDefault: true }, { id: LOCATION_ID }]);
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceLocation.findMany.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceLocationGetAll(member);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceLocationGetById', () => {
    it('returns INVALID_INPUT when the location id is not a uuid', async () => {
      const result = await workspaceLocationGetById(member, 'not-a-uuid');

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns 200 with the location', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());

      const result = await workspaceLocationGetById(member, LOCATION_ID);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: LOCATION_ID });
    });

    it('returns LOCATION_NOT_FOUND when no location matches in the workspace', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceLocationGetById(member, LOCATION_ID);

      expect(result.status).toBe(404);
    });
  });

  describe('workspaceLocationCreate', () => {
    const payload = { name: 'Second' } as Parameters<typeof workspaceLocationCreate>[1];

    it('returns 201 with the created location', async () => {
      mockInsert([locationRow({ name: 'Second' })]);

      const result = await workspaceLocationCreate(member, payload);

      expect(result.status).toBe(201);
      expect(result.body).toMatchObject({ name: 'Second' });
    });

    it('returns LOCATION_CREATE_FAILED when the insert returns no row', async () => {
      mockInsert([]);

      const result = await workspaceLocationCreate(member, payload);

      expect(result.body).toMatchObject({ code: 'LOCATION_CREATE_FAILED' });
    });
  });

  describe('workspaceLocationUpdate', () => {
    it('returns INVALID_INPUT when the location id is not a uuid', async () => {
      const result = await workspaceLocationUpdate(member, 'not-a-uuid', {
        name: 'New',
      } as Parameters<typeof workspaceLocationUpdate>[2]);

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns the current location unchanged on an empty payload', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());

      const result = await workspaceLocationUpdate(
        member,
        LOCATION_ID,
        {} as Parameters<typeof workspaceLocationUpdate>[2]
      );

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: LOCATION_ID });
    });

    it('returns LOCATION_NOT_FOUND when an empty payload targets a missing location', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceLocationUpdate(
        member,
        LOCATION_ID,
        {} as Parameters<typeof workspaceLocationUpdate>[2]
      );

      expect(result.status).toBe(404);
    });

    it('returns 200 with the updated location', async () => {
      mockUpdate([locationRow({ name: 'Renamed' })]);

      const result = await workspaceLocationUpdate(member, LOCATION_ID, {
        name: 'Renamed',
      } as Parameters<typeof workspaceLocationUpdate>[2]);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ name: 'Renamed' });
    });

    it('returns LOCATION_NOT_FOUND when a valid id matches no row', async () => {
      mockUpdate([]);

      const result = await workspaceLocationUpdate(member, LOCATION_ID, {
        name: 'Renamed',
      } as Parameters<typeof workspaceLocationUpdate>[2]);

      expect(result.status).toBe(404);
    });
  });

  describe('workspaceLocationSetDefault', () => {
    it('returns INVALID_INPUT when the location id is not a uuid', async () => {
      const result = await workspaceLocationSetDefault(member, 'not-a-uuid');

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns 200 with the promoted location', async () => {
      mockDb.transaction.mockResolvedValueOnce(locationRow({ isDefault: true }));

      const result = await workspaceLocationSetDefault(member, LOCATION_ID);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: LOCATION_ID, isDefault: true });
    });

    it('returns LOCATION_NOT_FOUND when the target is not in the workspace', async () => {
      mockDb.transaction.mockResolvedValueOnce(undefined);

      const result = await workspaceLocationSetDefault(member, LOCATION_ID);

      expect(result.status).toBe(404);
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.transaction.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceLocationSetDefault(member, LOCATION_ID);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceLocationDelete', () => {
    it('returns LOCATION_NOT_FOUND when the workspace has no default location', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceLocationDelete(member, LOCATION_ID);

      expect(result.body).toMatchObject({ code: 'LOCATION_NOT_FOUND' });
    });

    it("refuses to delete the workspace's default location", async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(
        locationRow({ id: LOCATION_ID, isDefault: true })
      );

      const result = await workspaceLocationDelete(member, LOCATION_ID);

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'LOCATION_IS_DEFAULT' });
    });

    it('deletes a non-default location and returns 204', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(
        locationRow({ id: DEFAULT_LOCATION_ID, isDefault: true })
      );
      mockDb.transaction.mockResolvedValueOnce([locationRow()]);

      const result = await workspaceLocationDelete(member, LOCATION_ID);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });
  });

  describe('workspaceLocationMemberAssign', () => {
    it('returns INVALID_INPUT when the location id is not a uuid', async () => {
      const result = await workspaceLocationMemberAssign(member, 'not-a-uuid', MEMBER_ID);

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns INVALID_INPUT when the member id is not a uuid', async () => {
      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, 'not-a-uuid');

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns LOCATION_NOT_FOUND when the location is not in the workspace', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, MEMBER_ID);

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'LOCATION_NOT_FOUND' });
    });

    it('returns MEMBER_NOT_FOUND when the member is not in the workspace', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, MEMBER_ID);

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'MEMBER_NOT_FOUND' });
    });

    it('returns MEMBER_NOT_FOUND when the member is suspended', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        memberRow({ status: 'suspended' })
      );

      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, MEMBER_ID);

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'MEMBER_NOT_FOUND' });
    });

    it('assigns the member and returns 204', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow());
      mockInsert([{ id: 'assignment-1', memberId: MEMBER_ID, locationId: LOCATION_ID }]);

      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, MEMBER_ID);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('is idempotent: an already-assigned member still returns 204', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow());
      mockInsertReject(uniqueViolation);

      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, MEMBER_ID);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('returns LOCATION_MEMBER_ASSIGN_FAILED when the insert returns no row', async () => {
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(locationRow());
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow());
      mockInsert([]);

      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, MEMBER_ID);

      expect(result.body).toMatchObject({ code: 'LOCATION_MEMBER_ASSIGN_FAILED' });
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceLocation.findFirst.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceLocationMemberAssign(member, LOCATION_ID, MEMBER_ID);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceLocationMemberUnassign', () => {
    const payload = {} as Parameters<typeof workspaceLocationMemberUnassign>[3];

    it('returns INVALID_INPUT when the location id is not a uuid', async () => {
      const result = await workspaceLocationMemberUnassign(
        member,
        'not-a-uuid',
        MEMBER_ID,
        payload
      );

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns INVALID_INPUT when the member id is not a uuid', async () => {
      const result = await workspaceLocationMemberUnassign(
        member,
        LOCATION_ID,
        'not-a-uuid',
        payload
      );

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns INVALID_INPUT when reassignToMemberId is not a uuid', async () => {
      const result = await workspaceLocationMemberUnassign(member, LOCATION_ID, MEMBER_ID, {
        reassignToMemberId: 'not-a-uuid',
      } as Parameters<typeof workspaceLocationMemberUnassign>[3]);

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('unassigns the member and returns 204', async () => {
      mockDelete();

      const result = await workspaceLocationMemberUnassign(member, LOCATION_ID, MEMBER_ID, payload);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('is idempotent: unassigning a member who is not assigned still returns 204', async () => {
      mockDelete();

      const result = await workspaceLocationMemberUnassign(member, LOCATION_ID, MEMBER_ID, payload);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.delete.mockImplementationOnce(() => {
        throw new Error('db down');
      });

      const result = await workspaceLocationMemberUnassign(member, LOCATION_ID, MEMBER_ID, payload);

      expect(result.status).toBe(500);
    });
  });
});
