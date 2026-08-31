import type { MemberContext, SessionUser, WorkspaceContext } from '#/types/context.ts';

import {
  workspaceInviteAccept,
  workspaceInviteCreate,
  workspaceInviteDecline,
  workspaceInviteDelete,
  workspaceInviteGetAll,
  workspaceInviteGetById,
  workspaceInvitePreviewByToken,
} from './invite.controller.ts';

// A single mutable db double, driven per test. `getDb()` (used by both the
// controller and invite.utils) resolves to it, so mocking one module covers
// every query path exercised here.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspaceInvite: { findFirst: vi.fn(), findMany: vi.fn() },
      workspaceLocation: { findFirst: vi.fn() },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    execute: vi.fn(),
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(mockDb)),
  },
}));

vi.mock('#/config/db-context.ts', () => ({ getDb: () => mockDb, afterCommit: vi.fn() }));

vi.mock('#/config/logger.ts', () => ({
  logger: { error: vi.fn(), child: vi.fn(() => ({ error: vi.fn() })) },
}));

/** `expireStalePendingInvite`: `update(...).set(...).where()` resolving (no returning). */
const mockExpireStale = () => {
  mockDb.update.mockReturnValue({ set: () => ({ where: () => Promise.resolve(undefined) }) });
};

/** `hasActiveMemberWithEmail`: `select(...).from().innerJoin().where().limit()` resolving `rows`. */
const mockActiveMember = (rows: unknown[]) => {
  mockDb.select.mockReturnValue({
    from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }) }),
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

/** `workspaceInviteDelete`: `update(...).set(...).where(...).returning()` resolving with `rows`. */
const mockRevoke = (rows: unknown[]) => {
  mockDb.update.mockReturnValue({
    set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }),
  });
};

/** A Postgres unique-violation error for the pending-invite index. */
const uniqueViolation = Object.assign(new Error('duplicate key'), {
  code: '23505',
  constraint: 'workspace_invite_workspace_email_pending_unique',
});

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const INVITE_ID = '33333333-3333-4333-8333-333333333333';
const LOCATION_ID = '44444444-4444-4444-8444-444444444444';
const USER_ID = '55555555-5555-4555-8555-555555555555';

const workspace: WorkspaceContext = { id: WORKSPACE_ID, name: 'Workspace' };
const member: MemberContext = { id: MEMBER_ID, role: 'owner', locale: 'en' };
const user: SessionUser = {
  id: USER_ID,
  email: 'owner@ordre.app',
  fullName: 'Owner User',
  firstName: 'Owner',
  lastName: 'User',
};

/** A workspace_invite row, as Drizzle returns it (Date timestamps). */
const inviteRow = (overrides: Record<string, unknown> = {}) => ({
  id: INVITE_ID,
  email: 'invitee@ordre.app',
  name: 'Invitee',
  role: 'member',
  workspaceId: WORKSPACE_ID,
  locationId: null,
  status: 'pending',
  invitedByMemberId: MEMBER_ID,
  token: 'tok_abc',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  expiresAt: new Date('2024-03-03T00:00:00.000Z'),
  ...overrides,
});

/** A minimal valid create payload. */
const createPayload = (overrides: Record<string, unknown> = {}) =>
  ({
    email: 'invitee@ordre.app',
    name: 'Invitee',
    role: 'member',
    ...overrides,
  }) as Parameters<typeof workspaceInviteCreate>[3];

describe('controllers/workspace/invite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('workspaceInviteCreate', () => {
    it('returns INVALID_INPUT when the payload fails validation', async () => {
      const result = await workspaceInviteCreate(workspace, user, member, { name: 'x' } as never);

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns 201 with the created invite (no location)', async () => {
      mockExpireStale();
      mockActiveMember([]);
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);
      mockInsert([inviteRow()]);

      const result = await workspaceInviteCreate(workspace, user, member, createPayload());

      expect(result.status).toBe(201);
      expect(result.body).toMatchObject({ id: INVITE_ID, email: 'invitee@ordre.app' });
    });

    it('returns 201 when a valid location in the workspace is supplied', async () => {
      mockExpireStale();
      mockActiveMember([]);
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce({ id: LOCATION_ID });
      mockInsert([inviteRow({ locationId: LOCATION_ID })]);

      const result = await workspaceInviteCreate(
        workspace,
        user,
        member,
        createPayload({ locationId: LOCATION_ID })
      );

      expect(result.status).toBe(201);
    });

    it('returns MEMBER_ALREADY_EXISTS when an active member has the email', async () => {
      mockExpireStale();
      mockActiveMember([{ id: 'existing-member' }]);

      const result = await workspaceInviteCreate(workspace, user, member, createPayload());

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'MEMBER_ALREADY_EXISTS' });
    });

    it('returns INVITE_ALREADY_PENDING when a pending invite exists', async () => {
      mockExpireStale();
      mockActiveMember([]);
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce({ id: INVITE_ID });

      const result = await workspaceInviteCreate(workspace, user, member, createPayload());

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'INVITE_ALREADY_PENDING' });
    });

    it('returns LOCATION_NOT_FOUND when the supplied location is not in the workspace', async () => {
      mockExpireStale();
      mockActiveMember([]);
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);
      mockDb.query.workspaceLocation.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceInviteCreate(
        workspace,
        user,
        member,
        createPayload({ locationId: LOCATION_ID })
      );

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'LOCATION_NOT_FOUND' });
    });

    it('maps a concurrent pending-invite unique violation to INVITE_ALREADY_PENDING', async () => {
      mockExpireStale();
      mockActiveMember([]);
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);
      mockInsertReject(uniqueViolation);

      const result = await workspaceInviteCreate(workspace, user, member, createPayload());

      expect(result.status).toBe(409);
      expect(result.body).toMatchObject({ code: 'INVITE_ALREADY_PENDING' });
    });

    it('returns INVITE_CREATE_FAILED when the insert yields no row', async () => {
      mockExpireStale();
      mockActiveMember([]);
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);
      mockInsert([]);

      const result = await workspaceInviteCreate(workspace, user, member, createPayload());

      expect(result.body).toMatchObject({ code: 'INVITE_CREATE_FAILED' });
    });

    it('returns INTERNAL_ERROR on an unexpected (non-unique) error', async () => {
      mockExpireStale();
      mockActiveMember([]);
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);
      mockInsertReject(new Error('db down'));

      const result = await workspaceInviteCreate(workspace, user, member, createPayload());

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceInviteDelete', () => {
    it('returns INVALID_INPUT when the invite id is not a uuid', async () => {
      const result = await workspaceInviteDelete(workspace, 'not-a-uuid');

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('revokes a pending invite and returns 204', async () => {
      mockRevoke([inviteRow({ status: 'revoked' })]);

      const result = await workspaceInviteDelete(workspace, INVITE_ID);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('returns INVITE_NOT_FOUND when no pending invite matches', async () => {
      mockRevoke([]);

      const result = await workspaceInviteDelete(workspace, INVITE_ID);

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'INVITE_NOT_FOUND' });
    });
  });

  describe('workspaceInviteGetById', () => {
    it('returns INVALID_INPUT when the invite id is not a uuid', async () => {
      const result = await workspaceInviteGetById(workspace, 'not-a-uuid');

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns 200 with the invite', async () => {
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(inviteRow());

      const result = await workspaceInviteGetById(workspace, INVITE_ID);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: INVITE_ID });
    });

    it('returns INVITE_NOT_FOUND when no invite matches in the workspace', async () => {
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceInviteGetById(workspace, INVITE_ID);

      expect(result.status).toBe(404);
    });
  });

  describe('workspaceInviteGetAll', () => {
    it('returns 200 with the mapped invites', async () => {
      mockDb.query.workspaceInvite.findMany.mockResolvedValueOnce([inviteRow(), inviteRow()]);

      const result = await workspaceInviteGetAll(workspace);

      expect(result.status).toBe(200);
      expect(result.body).toHaveLength(2);
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspaceInvite.findMany.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceInviteGetAll(workspace);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceInvitePreviewByToken', () => {
    const previewRow = () => ({
      invite_email: 'invitee@ordre.app',
      invitee_name: 'Invitee',
      member_role: 'member',
      workspace_name: 'Test Workspace',
      workspace_logo: null,
      invited_by_name: 'Owner',
      expires_at: '2026-07-31T20:21:00.143Z',
    });

    it('returns 200 with the mapped preview', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [previewRow()] });

      const result = await workspaceInvitePreviewByToken('tok_abc');

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({
        email: 'invitee@ordre.app',
        expiresAt: '2026-07-31T20:21:00.143Z',
      });
    });

    it('returns INVITE_NOT_FOUND when the function returns no row', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await workspaceInvitePreviewByToken('tok_abc');

      expect(result.status).toBe(404);
    });
  });

  describe('workspaceInviteAccept', () => {
    const mockAccept = (status: string) => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ app_invite_accept: status }] });
      // Only a first-time join queues a contact sync, which reads the caller's
      // memberships and writes an outbox row. The other statuses leave these unused.
      mockDb.select.mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([]) }) });
      mockDb.insert.mockReturnValueOnce({ values: () => Promise.resolve(undefined) });
    };

    it('returns 204 on ACCEPTED', async () => {
      mockAccept('ACCEPTED');

      const result = await workspaceInviteAccept('tok_abc', user);

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('returns 204 on ALREADY_MEMBER (idempotent)', async () => {
      mockAccept('ALREADY_MEMBER');

      expect((await workspaceInviteAccept('tok_abc', user)).status).toBe(204);
    });

    it('returns INVITE_EMAIL_MISMATCH (403)', async () => {
      mockAccept('INVITE_EMAIL_MISMATCH');

      const result = await workspaceInviteAccept('tok_abc', user);

      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({ code: 'INVITE_EMAIL_MISMATCH' });
    });

    it('returns UNAUTHORIZED (401)', async () => {
      mockAccept('UNAUTHORIZED');

      const result = await workspaceInviteAccept('tok_abc', user);

      expect(result.status).toBe(401);
      expect(result.body).toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('returns INVITE_NOT_FOUND for any other status', async () => {
      mockAccept('WORKSPACE_NOT_FOUND');

      const result = await workspaceInviteAccept('tok_abc', user);

      expect(result.status).toBe(404);
      expect(result.body).toMatchObject({ code: 'INVITE_NOT_FOUND' });
    });
  });

  describe('workspaceInviteDecline', () => {
    it('returns 204 when a pending invite was declined', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ app_invite_decline: INVITE_ID }] });

      const result = await workspaceInviteDecline('tok_abc');

      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('returns INVITE_NOT_FOUND when the function returns no id', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ app_invite_decline: null }] });

      const result = await workspaceInviteDecline('tok_abc');

      expect(result.status).toBe(404);
    });
  });
});
