import type { WorkspaceInviteRow, WorkspaceLocationRow, WorkspaceMemberRow } from '#/types/db.ts';

import type { InvitePreviewRow } from './invite.utils.ts';
import {
  expireStalePendingInvite,
  findInvite,
  findInvites,
  hasActiveMemberWithEmail,
  hasPendingInvite,
  toInvitePreviewResponse,
  toInviteResponse,
} from './invite.utils.ts';

// A single mutable db double, driven per test. `getDb()` resolves to it.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspaceInvite: { findFirst: vi.fn(), findMany: vi.fn() },
      workspaceLocation: { findFirst: vi.fn() },
    },
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('#/config/db-context.ts', () => ({ getDb: () => mockDb }));

/** `select(...).from(...).innerJoin(...).where(...).limit()` resolving with `rows`. */
const mockActiveMemberSelect = (rows: unknown[]) => {
  mockDb.select.mockReturnValue({
    from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }) }),
  });
};

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const INVITE_ID = '22222222-2222-4222-8222-222222222222';
const LOCATION_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';

/** A workspace_invite row, as Drizzle returns it (Date timestamps). */
const inviteRow = (overrides: Partial<WorkspaceInviteRow> = {}): WorkspaceInviteRow => ({
  id: INVITE_ID,
  email: 'invitee@ordre.app',
  name: 'Invitee',
  role: 'member',
  workspaceId: WORKSPACE_ID,
  locationId: null,
  status: 'pending',
  invitedByMemberId: null,
  token: 'tok_abc',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-02-02T00:00:00.000Z'),
  expiresAt: new Date('2024-03-03T00:00:00.000Z'),
  ...overrides,
});

const locationRow = (): WorkspaceLocationRow => ({
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
});

const memberRow = (): WorkspaceMemberRow => ({
  id: MEMBER_ID,
  userId: 'user-1',
  workspaceId: WORKSPACE_ID,
  displayName: 'Sender',
  title: null,
  role: 'owner',
  status: 'active',
  phone: null,
  locale: 'en',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
});

describe('controllers/workspace/invite.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toInviteResponse', () => {
    it('maps the invite columns and serializes timestamps', () => {
      const result = toInviteResponse(inviteRow());

      expect(result).toMatchObject({
        id: INVITE_ID,
        email: 'invitee@ordre.app',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
        expiresAt: '2024-03-03T00:00:00.000Z',
      });
    });

    it('never returns the invite token', () => {
      const result = toInviteResponse(inviteRow());

      expect(result).not.toHaveProperty('token');
    });

    it('omits `location` / `invitedByMember` when the relations were not loaded', () => {
      const result = toInviteResponse(inviteRow());

      expect(result).not.toHaveProperty('location');
      expect(result).not.toHaveProperty('invitedByMember');
    });

    it('sets the relation to null when loaded but the underlying id is unset', () => {
      const result = toInviteResponse({ ...inviteRow(), location: null, invitedByMember: null });

      expect(result.location).toBeNull();
      expect(result.invitedByMember).toBeNull();
    });

    it('embeds the base shapes when the relations are present', () => {
      const result = toInviteResponse({
        ...inviteRow(),
        location: locationRow(),
        invitedByMember: memberRow(),
      });

      expect(result.location).toMatchObject({ id: LOCATION_ID });
      expect(result.invitedByMember).toMatchObject({ id: MEMBER_ID });
    });
  });

  describe('toInvitePreviewResponse', () => {
    const previewRow = (overrides: Partial<InvitePreviewRow> = {}): InvitePreviewRow => ({
      invite_email: 'invitee@ordre.app',
      invitee_name: 'Invitee',
      member_role: 'member',
      workspace_name: 'Test Workspace',
      workspace_logo: null,
      invited_by_name: 'Owner',
      expires_at: '2026-07-31T20:21:00.143Z',
      ...overrides,
    });

    it('maps the snake_case columns to the preview shape', () => {
      expect(toInvitePreviewResponse(previewRow())).toMatchObject({
        email: 'invitee@ordre.app',
        name: 'Invitee',
        role: 'member',
        workspaceName: 'Test Workspace',
        workspaceLogo: null,
        invitedByName: 'Owner',
      });
    });

    it('passes through the ISO-8601 UTC timestamp the SQL function formats', () => {
      expect(toInvitePreviewResponse(previewRow()).expiresAt).toBe('2026-07-31T20:21:00.143Z');
    });
  });

  describe('hasActiveMemberWithEmail', () => {
    it('returns true when an active member with the email exists', async () => {
      mockActiveMemberSelect([{ id: MEMBER_ID }]);

      expect(await hasActiveMemberWithEmail(WORKSPACE_ID, 'a@b.co')).toBe(true);
    });

    it('returns false when none matches', async () => {
      mockActiveMemberSelect([]);

      expect(await hasActiveMemberWithEmail(WORKSPACE_ID, 'a@b.co')).toBe(false);
    });
  });

  describe('hasPendingInvite', () => {
    it('returns true when a pending invite exists', async () => {
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce({ id: INVITE_ID });

      expect(await hasPendingInvite(WORKSPACE_ID, 'a@b.co')).toBe(true);
    });

    it('returns false when none exists', async () => {
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(undefined);

      expect(await hasPendingInvite(WORKSPACE_ID, 'a@b.co')).toBe(false);
    });
  });

  describe('expireStalePendingInvite', () => {
    it('issues the scoped status update and resolves', async () => {
      const where = vi.fn(() => Promise.resolve(undefined));
      mockDb.update.mockReturnValue({ set: () => ({ where }) });

      await expect(expireStalePendingInvite(WORKSPACE_ID, 'a@b.co')).resolves.toBeUndefined();
      expect(where).toHaveBeenCalledOnce();
    });
  });

  describe('read helpers pass their result through', () => {
    it('findInvite returns the row the query resolves', async () => {
      mockDb.query.workspaceInvite.findFirst.mockResolvedValueOnce(inviteRow());

      expect(await findInvite(WORKSPACE_ID, INVITE_ID)).toMatchObject({ id: INVITE_ID });
    });

    it('findInvites returns the rows the query resolves', async () => {
      mockDb.query.workspaceInvite.findMany.mockResolvedValueOnce([inviteRow()]);

      expect(await findInvites(WORKSPACE_ID)).toHaveLength(1);
    });
  });
});
