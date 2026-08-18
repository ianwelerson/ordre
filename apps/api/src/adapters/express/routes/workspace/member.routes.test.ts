import { app } from '#/adapters/express/server.ts';
import { auth } from '#/config/auth.ts';
import { MEMBER_IDS, USER_IDS, userFixtures, WORKSPACE_IDS } from '#/test/fixtures.ts';
import { parseBody } from '#/utils/testing.ts';
import request from 'supertest';

import { API_BASE_PATH, API_ROUTES, buildPath } from '@ordre/core/constants';
import { errorMessage } from '@ordre/core/errors';
import { ResponseErrorSchema, WorkspaceMemberSchema } from '@ordre/core/schemas';

const memberUrl = (path: string, params: Record<string, string>) =>
  `${API_BASE_PATH}${buildPath(path, params)}`;

/** `/v1/workspace/:id/member` for a given workspace. */
const listUrl = (workspaceId: string) =>
  memberUrl(API_ROUTES.workspace.member.collection, { id: workspaceId });

const itemUrl = (workspaceId: string, memberId: string) =>
  memberUrl(API_ROUTES.workspace.member.byId, { id: workspaceId, memberId });
const roleUrl = (workspaceId: string, memberId: string) =>
  memberUrl(API_ROUTES.workspace.member.role, { id: workspaceId, memberId });
const selfUrl = (workspaceId: string) =>
  memberUrl(API_ROUTES.workspace.member.self, { id: workspaceId });
const leaveUrl = (workspaceId: string) =>
  memberUrl(API_ROUTES.workspace.member.leave, { id: workspaceId });

vi.mock('#/config/auth.ts', () => ({ auth: { api: { getSession: vi.fn() } } }));

const mockUserSession = (user?: Record<string, string>) => {
  const seed = userFixtures.find((u) => u.id === USER_IDS.member);

  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: seed?.id, email: seed?.email, ...user },
  } as Awaited<ReturnType<typeof auth.api.getSession>>);
};

/**
 * RBAC matrix exercised below (one test per marked cell):
 *
 * | Route                                 | owner | admin | member | non-member | unauth |
 * | ------------------------------------- | ----- | ----- | ------ | ---------- | ------ |
 * | GET    /member          (member:manage)|  200  |  200  |  403   |    404     |  401   |
 * | GET    /member/me       (access only)  |  200  |   -   |  200   |    404     |  401   |
 * | PATCH  /member/me       (access only)  |   -   |   -   |  200   |     -      |   -    |
 * | POST   /member/leave    (access only)  |  409  |   -   |  204   |     -      |   -    |
 * | GET    /member/:mid     (member:manage)|  200  |   -   |  403   |     -      |   -    |
 * | PATCH  /member/:mid     (member:manage)|  200  |   -   |   -    |     -      |   -    |
 * | DELETE /member/:mid     (member:manage)|  204  |  409  |  403   |     -      |   -    |
 * | POST   /member/:mid/role(member:manage)|  200  |  409  |  403   |     -      |   -    |
 *
 * `member:manage` is held by owner and admin; self-service (`/me`, `/leave`) needs
 * only workspace access. A non-member (`outsider`) 404s at `requireWorkspaceAccess`,
 * and a suspended member 403s there - before any permission check, so it holds for
 * every route in the table.
 */
describe('Workspace Member', () => {
  const WS = WORKSPACE_IDS.primary;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe(`GET ${API_ROUTES.workspace.member.collection}`, () => {
    test('GET allows the owner to list members (has member:manage)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(listUrl(WS)).send().expect(200);

      const members = parseBody(WorkspaceMemberSchema.array(), response.body);

      // owner + admin + member + the suspended member seeded in the primary
      // workspace. Suspension gates access, not visibility - an admin still needs
      // to see the row to lift it.
      expect(members).toHaveLength(4);
    });

    test('GET allows an admin to list members', async () => {
      mockUserSession({ id: USER_IDS.admin });

      await request(app).get(listUrl(WS)).send().expect(200);
    });

    // The suspended member also lacks `member:manage`, so a status check placed
    // after the permission guard would answer FORBIDDEN here instead.
    test('GET rejects a suspended member with MEMBER_SELF_SUSPENDED, not FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.suspended });

      const response = await request(app).get(listUrl(WS)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_SELF_SUSPENDED');
    });

    test('GET forbids a member (lacks member:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).get(listUrl(WS)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });

    test('GET hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({ id: USER_IDS.outsider });

      const response = await request(app).get(listUrl(WS)).send().expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('WORKSPACE_NOT_FOUND');
    });

    // Self-service, so it needs only workspace access - proving the rejection comes
    // from the membership guard and not from a missing `member:manage`.
    test('GET /me rejects a suspended member with MEMBER_SELF_SUSPENDED', async () => {
      mockUserSession({ id: USER_IDS.suspended });

      const response = await request(app).get(selfUrl(WS)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_SELF_SUSPENDED');
    });

    test('GET rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app).get(listUrl(WS)).send().expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(errorMessage('UNAUTHORIZED'));
    });
  });

  describe(`GET/PATCH ${API_ROUTES.workspace.member.self}`, () => {
    test('GET /me returns the caller their own membership', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).get(selfUrl(WS)).send().expect(200);

      const self = parseBody(WorkspaceMemberSchema, response.body);

      expect(self.id).toBe(MEMBER_IDS.member);
      expect(self.role).toBe('member');
    });

    test('GET /me is allowed for the owner too (access only, no manage needed)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(selfUrl(WS)).send().expect(200);

      expect(parseBody(WorkspaceMemberSchema, response.body).id).toBe(MEMBER_IDS.owner);
    });

    test('GET /me 404s for a non-member', async () => {
      mockUserSession({ id: USER_IDS.outsider });

      await request(app).get(selfUrl(WS)).send().expect(404);
    });

    test('GET /me rejects an unauthenticated request with UNAUTHORIZED', async () => {
      await request(app).get(selfUrl(WS)).send().expect(401);
    });

    test('PATCH /me updates the caller their own profile', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .patch(selfUrl(WS))
        .send({ displayName: 'New Name' })
        .expect(200);

      const self = parseBody(WorkspaceMemberSchema, response.body);

      expect(self.id).toBe(MEMBER_IDS.member);
      expect(self.displayName).toBe('New Name');
    });
  });

  describe(`POST ${API_ROUTES.workspace.member.leave}`, () => {
    test('POST /leave lets a plain member leave (204)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).post(leaveUrl(WS)).send().expect(204);

      expect(response.body).toEqual({});
    });

    test('POST /leave refuses the last active owner with MEMBER_LAST_OWNER', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).post(leaveUrl(WS)).send().expect(409);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_LAST_OWNER');
    });
  });

  describe(`${API_ROUTES.workspace.member.byId}`, () => {
    test('GET /:memberId allows the owner to read a member', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(itemUrl(WS, MEMBER_IDS.member)).send().expect(200);

      expect(parseBody(WorkspaceMemberSchema, response.body).id).toBe(MEMBER_IDS.member);
    });

    test('GET /:memberId forbids a member (lacks member:manage)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).get(itemUrl(WS, MEMBER_IDS.member)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });

    test('GET /:memberId returns MEMBER_NOT_FOUND for an unknown member', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(itemUrl(WS, MEMBER_IDS.missing)).send().expect(404);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_NOT_FOUND');
    });

    test('PATCH /:memberId lets the owner update a member profile', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .patch(itemUrl(WS, MEMBER_IDS.member))
        .send({ title: 'Barista' })
        .expect(200);

      expect(parseBody(WorkspaceMemberSchema, response.body).title).toBe('Barista');
    });

    test('DELETE /:memberId lets the owner remove a plain member (204)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).delete(itemUrl(WS, MEMBER_IDS.member)).send().expect(204);

      expect(response.body).toEqual({});
    });

    test('DELETE /:memberId refuses self-removal with MEMBER_SELF_REMOVE', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).delete(itemUrl(WS, MEMBER_IDS.owner)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_SELF_REMOVE');
    });

    test('DELETE /:memberId forbids an admin removing an owner with MEMBER_REMOVE_FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.admin });

      const response = await request(app).delete(itemUrl(WS, MEMBER_IDS.owner)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_REMOVE_FORBIDDEN');
    });

    test('DELETE /:memberId forbids a member (lacks member:manage)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).delete(itemUrl(WS, MEMBER_IDS.admin)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });
  });

  describe(`POST ${API_ROUTES.workspace.member.role}`, () => {
    test('POST /:memberId/role lets the owner promote a member to admin', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(roleUrl(WS, MEMBER_IDS.member))
        .send({ role: 'admin' })
        .expect(200);

      expect(parseBody(WorkspaceMemberSchema, response.body).role).toBe('admin');
    });

    test('POST /:memberId/role refuses a self role change with MEMBER_SELF_ROLE_UPDATE', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(roleUrl(WS, MEMBER_IDS.owner))
        .send({ role: 'admin' })
        .expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_SELF_ROLE_UPDATE');
    });

    test('POST /:memberId/role forbids an admin granting the owner role', async () => {
      mockUserSession({ id: USER_IDS.admin });

      const response = await request(app)
        .post(roleUrl(WS, MEMBER_IDS.member))
        .send({ role: 'owner' })
        .expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe(
        'MEMBER_OWNER_ROLE_FORBIDDEN'
      );
    });

    test('POST /:memberId/role forbids a member (lacks member:manage)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .post(roleUrl(WS, MEMBER_IDS.admin))
        .send({ role: 'admin' })
        .expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('FORBIDDEN');
    });
  });
});
