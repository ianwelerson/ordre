import { app, BASE_PATH } from '#/adapters/express/server.ts';
import { auth } from '#/config/auth.ts';
import { setFreePlanLimits } from '#/test/db.ts';
import { INVITE_IDS, USER_IDS, userFixtures, WORKSPACE_IDS } from '#/test/fixtures.ts';
import { parseBody } from '#/utils/testing.ts';
import request from 'supertest';

import { AUTH_ERRORS } from '@ordre/core/errors';
import { ResponseErrorSchema, WorkspaceInviteSchema } from '@ordre/core/schemas';

import { inviteItemPath, workspaceBasePath, workspaceInviteBasePath } from './workspace.paths.ts';

const BASE = `${BASE_PATH}${workspaceBasePath}`;

/** `/api/workspace/:id/invite` for a given workspace. */
const collectionUrl = (workspaceId: string) =>
  `${BASE}${workspaceInviteBasePath.replace(':id', workspaceId)}`;

/** `/api/workspace/:id/invite/:inviteId` for a given workspace + invite. */
const itemUrl = (workspaceId: string, inviteId: string) =>
  `${BASE}${workspaceInviteBasePath}${inviteItemPath}`
    .replace(':id', workspaceId)
    .replace(':inviteId', inviteId);

vi.mock('#/config/auth.ts', () => ({ auth: { api: { getSession: vi.fn() } } }));

const mockUserSession = (user?: Record<string, string>) => {
  const seed = userFixtures.find((u) => u.id === USER_IDS.member);

  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: seed?.id, email: seed?.email, ...user },
  } as Awaited<ReturnType<typeof auth.api.getSession>>);
};

/**
 * The admin (member-facing) invite routes, all gated on `workspace:member:manage`
 * (owner + admin). A member is authenticated but lacks the permission (403); a
 * non-member 404s at `requireWorkspaceAccess`; an unauthenticated caller 401s.
 */
describe('Workspace Invite (admin)', () => {
  const WS = WORKSPACE_IDS.primary;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe(`POST ${workspaceBasePath}${workspaceInviteBasePath}`, () => {
    const invite = (overrides: Record<string, unknown> = {}) => ({
      email: 'new-invitee@ordre.app',
      name: 'New Invitee',
      role: 'member',
      ...overrides,
    });

    test('POST lets the owner create an invite (201)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).post(collectionUrl(WS)).send(invite()).expect(201);

      const created = parseBody(WorkspaceInviteSchema, response.body);

      expect(created.email).toBe('new-invitee@ordre.app');
      expect(created.status).toBe('pending');
    });

    test('POST lets an admin create an invite (201)', async () => {
      mockUserSession({ id: USER_IDS.admin });

      await request(app).post(collectionUrl(WS)).send(invite()).expect(201);
    });

    test('POST rejects a duplicate pending email with INVITE_ALREADY_PENDING', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send(invite({ email: 'pending-invitee@ordre.app' }))
        .expect(409);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVITE_ALREADY_PENDING');
    });

    test('POST rejects the email of an existing active member with MEMBER_ALREADY_EXISTS', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send(invite({ email: 'member@ordre.app' }))
        .expect(409);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_ALREADY_EXISTS');
    });

    test('POST rejects a location outside the workspace with LOCATION_NOT_FOUND', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send(invite({ locationId: '00000000-0000-4000-8000-000000000000' }))
        .expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('LOCATION_NOT_FOUND');
    });

    test('POST rejects an invalid payload with INVALID_INPUT', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'No Email' })
        .expect(400);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVALID_INPUT');
    });

    test('POST forbids a member (lacks member:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).post(collectionUrl(WS)).send(invite()).expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });

    test('POST hides the workspace from a non-member with NOT_FOUND', async () => {
      mockUserSession({ id: USER_IDS.outsider });

      const response = await request(app).post(collectionUrl(WS)).send(invite()).expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('NOT_FOUND');
    });

    test('POST rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app).post(collectionUrl(WS)).send(invite()).expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(AUTH_ERRORS.UNAUTHORIZED.message);
    });

    // --- Plan quota ---
    // The seeded plans are uncapped (see `planFixtures`), so each case narrows
    // the cap it needs.
    test('POST refuses an invite once the plan seats are full', async () => {
      // The workspace is seeded with active members and pending invites, both of
      // which hold a seat, so one seat is already spent.
      await setFreePlanLimits({ seat: 1 });
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).post(collectionUrl(WS)).send(invite()).expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('SEAT_LIMIT_REACHED');
    });

    test('POST reports FORBIDDEN, not the seat cap, for a member who lacks the permission', async () => {
      // Billing state stays hidden from a caller who may not invite.
      await setFreePlanLimits({ seat: 1 });
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).post(collectionUrl(WS)).send(invite()).expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });

    test('POST still creates an invite while seats remain', async () => {
      await setFreePlanLimits({ seat: 20 });
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).post(collectionUrl(WS)).send(invite()).expect(201);

      expect(parseBody(WorkspaceInviteSchema, response.body).status).toBe('pending');
    });
  });

  describe(`GET ${workspaceBasePath}${workspaceInviteBasePath}`, () => {
    test('GET lists every invite (any status) for the owner', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(collectionUrl(WS)).send().expect(200);

      const invites = parseBody(WorkspaceInviteSchema.array(), response.body);

      // pending, pendingForOutsider, expired, accepted seeded in the primary workspace.
      expect(invites).toHaveLength(4);
    });

    test('GET forbids a member (lacks member:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).get(collectionUrl(WS)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });
  });

  describe(`GET ${workspaceBasePath}${workspaceInviteBasePath}${inviteItemPath}`, () => {
    test('GET /:inviteId returns the invite for the owner', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(itemUrl(WS, INVITE_IDS.pending)).send().expect(200);

      expect(parseBody(WorkspaceInviteSchema, response.body).id).toBe(INVITE_IDS.pending);
    });

    test('GET /:inviteId returns INVITE_NOT_FOUND for an unknown invite', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(itemUrl(WS, INVITE_IDS.missing)).send().expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVITE_NOT_FOUND');
    });

    test('GET /:inviteId forbids a member (lacks member:manage)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).get(itemUrl(WS, INVITE_IDS.pending)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });
  });

  describe(`DELETE ${workspaceBasePath}${workspaceInviteBasePath}${inviteItemPath}`, () => {
    test('DELETE revokes a pending invite for the owner (204)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .delete(itemUrl(WS, INVITE_IDS.pending))
        .send()
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('DELETE returns INVITE_NOT_FOUND for a non-pending invite', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .delete(itemUrl(WS, INVITE_IDS.accepted))
        .send()
        .expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('INVITE_NOT_FOUND');
    });

    test('DELETE returns INVITE_NOT_FOUND for an unknown invite', async () => {
      mockUserSession({ id: USER_IDS.owner });

      await request(app).delete(itemUrl(WS, INVITE_IDS.missing)).send().expect(404);
    });

    test('DELETE forbids a member (lacks member:manage)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .delete(itemUrl(WS, INVITE_IDS.pending))
        .send()
        .expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });
  });
});
