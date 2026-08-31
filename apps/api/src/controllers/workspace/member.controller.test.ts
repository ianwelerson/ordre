import type { MemberContext, SessionUser, WorkspaceContext } from '#/types/context.ts';

import {
  workspaceMemberChangeRole,
  workspaceMemberGetAll,
  workspaceMemberGetById,
  workspaceMemberGetSelf,
  workspaceMemberLeave,
  workspaceMemberRemove,
} from './member.controller.ts';

// A single mutable db double, driven per test. `getDb()` (used by both the
// controller and member.utils) resolves to it, so mocking one module covers
// every query path exercised here.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspaceMember: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    transaction: vi.fn(),
  },
}));

vi.mock('#/config/db-context.ts', () => ({
  getDb: () => mockDb,
  afterCommit: (fn: () => void) => fn(),
}));

vi.mock('#/config/logger.ts', () => ({
  logger: { error: vi.fn(), child: () => ({ info: vi.fn(), error: vi.fn() }) },
}));

/**
 * Runs `db.transaction(cb)` against a `tx` double so the controller's in-transaction
 * logic (owner count + update) actually executes.
 *
 * @param owners - Rows returned by the locked active-owner count `select`.
 * @param updated - Rows returned by the `update(...).returning()`.
 */
let capturedSet: Record<string, unknown> | undefined;
let capturedOutbox: Record<string, unknown>[] = [];

/** What `app_member_audience_state` returns for the member being acted on. */
const AUDIENCE_STATE = {
  email: 'target@ordre.app',
  first_name: 'Target',
  last_name: 'User',
  is_owner: false,
  is_member: true,
};

const mockTransaction = (owners: unknown[], updated: unknown[]) => {
  capturedSet = undefined;
  capturedOutbox = [];
  mockDb.transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb({
      select: () => ({
        from: () => ({
          where: () =>
            Object.assign(Promise.resolve(owners), { for: () => Promise.resolve(owners) }),
        }),
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => {
          capturedSet = values;

          return { where: () => ({ returning: () => Promise.resolve(updated) }) };
        },
      }),
      execute: () => Promise.resolve({ rows: [AUDIENCE_STATE] }),
      insert: () => ({
        values: (row: Record<string, unknown>) => {
          capturedOutbox.push(row);

          return Promise.resolve(undefined);
        },
      }),
    })
  );
};

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const CALLER_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_ID = '33333333-3333-4333-8333-333333333333';

const workspace: WorkspaceContext = { id: WORKSPACE_ID, name: 'Workspace' };
const owner: MemberContext = { id: CALLER_ID, role: 'owner', locale: 'en' };
const user: SessionUser = {
  id: 'user-1',
  email: 'owner@ordre.app',
  fullName: 'Owner User',
  firstName: 'Owner',
  lastName: 'User',
};
const admin: MemberContext = { id: CALLER_ID, role: 'admin', locale: 'en' };

/** A workspace_member row, as Drizzle returns it (Date timestamps). */
const memberRow = (overrides: Record<string, unknown> = {}) => ({
  id: TARGET_ID,
  workspaceId: WORKSPACE_ID,
  userId: '44444444-4444-4444-8444-444444444444',
  displayName: 'Casey',
  title: null,
  role: 'member',
  status: 'active',
  phone: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

/** `{ id }` rows for the locked active-owner count, one per owner. */
const ownerIds = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `owner-${i}` }));

const changePayload = (role: string) =>
  ({ role }) as Parameters<typeof workspaceMemberChangeRole>[3];

describe('controllers/workspace/member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('workspaceMemberGetAll', () => {
    it('returns 200 with the mapped members', async () => {
      mockDb.query.workspaceMember.findMany.mockResolvedValueOnce([memberRow(), memberRow()]);

      const result = await workspaceMemberGetAll(workspace);

      expect(result.status).toBe(200);
      expect(result.body).toHaveLength(2);
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceMember.findMany.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceMemberGetAll(workspace);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceMemberGetById', () => {
    it('returns INVALID_INPUT when the member id is not a uuid', async () => {
      const result = await workspaceMemberGetById(workspace, 'not-a-uuid');

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns 200 with the member', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow());

      const result = await workspaceMemberGetById(workspace, TARGET_ID);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: TARGET_ID });
    });

    it('returns MEMBER_NOT_FOUND when no member matches in the workspace', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceMemberGetById(workspace, TARGET_ID);

      expect(result.status).toBe(404);
    });
  });

  describe('workspaceMemberGetSelf', () => {
    it("returns 200 with the caller's own membership", async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ id: CALLER_ID }));

      const result = await workspaceMemberGetSelf(workspace, owner);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: CALLER_ID });
    });

    it('returns MEMBER_NOT_FOUND when the caller has no membership row', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceMemberGetSelf(workspace, owner);

      expect(result.status).toBe(404);
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceMember.findFirst.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceMemberGetSelf(workspace, owner);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceMemberChangeRole', () => {
    it('returns INVALID_INPUT when the member id is not a uuid', async () => {
      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        'not-a-uuid',
        changePayload('admin')
      );

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns INVALID_INPUT for an invalid role payload', async () => {
      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('superuser')
      );

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('refuses to let a caller change their own role', async () => {
      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        CALLER_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({ code: 'MEMBER_SELF_ROLE_UPDATE' });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('returns MEMBER_NOT_FOUND when the target does not exist', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'MEMBER_NOT_FOUND' });
    });

    it('forbids an admin from promoting a member to owner', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ role: 'member' }));

      const result = await workspaceMemberChangeRole(
        workspace,
        admin,
        TARGET_ID,
        changePayload('owner')
      );

      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({ code: 'MEMBER_OWNER_ROLE_FORBIDDEN' });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it("forbids an admin from changing an existing owner's role (demotion)", async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ role: 'owner' }));

      const result = await workspaceMemberChangeRole(
        workspace,
        admin,
        TARGET_ID,
        changePayload('member')
      );

      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({ code: 'MEMBER_OWNER_ROLE_FORBIDDEN' });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('lets an owner promote a member to owner', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ role: 'member' }));
      mockTransaction([], [memberRow({ role: 'owner' })]);

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('owner')
      );

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ role: 'owner' });
    });

    it('returns the member unchanged (no write) when the role already matches', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ role: 'admin' }));

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: TARGET_ID, role: 'admin' });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('refuses to demote the last active owner', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        memberRow({ role: 'owner', status: 'active' })
      );
      mockTransaction(ownerIds(1), []);

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'MEMBER_LAST_OWNER' });
    });

    it('demotes an owner when another active owner remains', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        memberRow({ role: 'owner', status: 'active' })
      );
      mockTransaction(ownerIds(2), [memberRow({ role: 'admin' })]);

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ role: 'admin' });
    });

    it('refuses to change the role of a suspended member', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        memberRow({ role: 'member', status: 'suspended' })
      );

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'MEMBER_TARGET_SUSPENDED' });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('returns MEMBER_NOT_FOUND when the update matches no row', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ role: 'member' }));
      mockTransaction([], []);

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'MEMBER_NOT_FOUND' });
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceMember.findFirst.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceMemberChangeRole(
        workspace,
        owner,
        TARGET_ID,
        changePayload('admin')
      );

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceMemberRemove', () => {
    const removePayload = {} as Parameters<typeof workspaceMemberRemove>[3];

    it('returns INVALID_INPUT when the member id is not a uuid', async () => {
      const result = await workspaceMemberRemove(workspace, owner, 'not-a-uuid', removePayload);

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('refuses to let a caller remove themselves', async () => {
      const result = await workspaceMemberRemove(workspace, owner, CALLER_ID, removePayload);

      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({ code: 'MEMBER_SELF_REMOVE' });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('returns MEMBER_NOT_FOUND when the target does not exist', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceMemberRemove(workspace, owner, TARGET_ID, removePayload);

      expect(result.status).toBe(404);
    });

    it('returns MEMBER_NOT_FOUND when the target is already suspended', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        memberRow({ status: 'suspended' })
      );

      const result = await workspaceMemberRemove(workspace, owner, TARGET_ID, removePayload);

      expect(result.status).toBe(404);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('forbids an admin from removing an owner or another admin', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ role: 'admin' }));

      const result = await workspaceMemberRemove(workspace, admin, TARGET_ID, removePayload);

      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({ code: 'MEMBER_REMOVE_FORBIDDEN' });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('lets an admin remove a plain member, scrubbing phone and resetting role', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(memberRow({ role: 'member' }));
      mockTransaction([], [memberRow({ status: 'suspended' })]);

      const result = await workspaceMemberRemove(workspace, admin, TARGET_ID, removePayload);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
      // Keeps displayName/title for audit; clears phone; resets role to member.
      expect(capturedSet).toEqual({ status: 'suspended', role: 'member', phone: null });
    });

    it('refuses to remove the last active owner', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        memberRow({ role: 'owner', status: 'active' })
      );
      mockTransaction(ownerIds(1), []);

      const result = await workspaceMemberRemove(workspace, owner, TARGET_ID, removePayload);

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'MEMBER_LAST_OWNER' });
    });

    it('removes an owner when another active owner remains', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        memberRow({ role: 'owner', status: 'active' })
      );
      mockTransaction(ownerIds(2), [memberRow({ status: 'suspended' })]);

      const result = await workspaceMemberRemove(workspace, owner, TARGET_ID, removePayload);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceMember.findFirst.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceMemberRemove(workspace, owner, TARGET_ID, removePayload);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceMemberLeave', () => {
    // The caller leaves themselves, so findMember resolves the caller's own row.
    const self = (overrides: Record<string, unknown> = {}) =>
      memberRow({ id: CALLER_ID, ...overrides });

    it('returns MEMBER_NOT_FOUND when the caller has no active membership', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceMemberLeave(workspace, owner, user);

      expect(result.status).toBe(404);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('returns MEMBER_NOT_FOUND when the caller is already suspended', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(self({ status: 'suspended' }));

      const result = await workspaceMemberLeave(workspace, owner, user);

      expect(result.status).toBe(404);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('lets a plain member leave', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(self({ role: 'member' }));
      mockTransaction([], [self({ status: 'suspended' })]);

      const result = await workspaceMemberLeave(workspace, { ...owner, role: 'member' }, user);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
      expect(capturedSet).toEqual({ status: 'suspended', role: 'member', phone: null });
    });

    it('refuses to let the last active owner leave', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        self({ role: 'owner', status: 'active' })
      );
      mockTransaction(ownerIds(1), []);

      const result = await workspaceMemberLeave(workspace, owner, user);

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'MEMBER_LAST_OWNER' });
    });

    it('lets an owner leave when another active owner remains', async () => {
      mockDb.query.workspaceMember.findFirst.mockResolvedValueOnce(
        self({ role: 'owner', status: 'active' })
      );
      mockTransaction(ownerIds(2), [self({ status: 'suspended' })]);

      const result = await workspaceMemberLeave(workspace, owner, user);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceMember.findFirst.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceMemberLeave(workspace, owner, user);

      expect(result.status).toBe(500);
    });
  });
});
