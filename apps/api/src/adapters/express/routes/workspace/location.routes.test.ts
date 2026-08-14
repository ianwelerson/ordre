import { app } from '#/adapters/express/server.ts';
import { auth } from '#/config/auth.ts';
import { setFreePlanLimits } from '#/test/db.ts';
import { LOCATION_IDS, USER_IDS, userFixtures, WORKSPACE_IDS } from '#/test/fixtures.ts';
import { parseBody } from '#/utils/testing.ts';
import request from 'supertest';

import { API_BASE_PATH, API_ROUTES, buildPath } from '@ordre/core/constants';
import {
  BASE_ERRORS,
  LOCATION_ERRORS,
  VALIDATION_ERRORS,
  WORKSPACE_ERRORS,
} from '@ordre/core/errors';
import { ResponseErrorSchema, WorkspaceLocationSchema } from '@ordre/core/schemas';

/** A syntactically valid member id that is never seeded, for behavior cases. */
const UNKNOWN_MEMBER_ID = 'a9b8c7d6-e5f4-4312-8110-fedcba987654';

const locationUrl = (path: string, params: Record<string, string>) =>
  `${API_BASE_PATH}${buildPath(path, params)}`;

/** `/v1/workspace/:id/location` for a given workspace. */
const collectionUrl = (workspaceId: string) =>
  locationUrl(API_ROUTES.workspace.location.collection, { id: workspaceId });

/** `/v1/workspace/:id/location/:locationId` for a given workspace + location. */
const itemUrl = (workspaceId: string, locationId: string) =>
  locationUrl(API_ROUTES.workspace.location.byId, { id: workspaceId, locationId });

/** `/v1/workspace/:id/location/:locationId/default` for a given workspace + location. */
const defaultUrl = (workspaceId: string, locationId: string) =>
  locationUrl(API_ROUTES.workspace.location.default, { id: workspaceId, locationId });

/** `/v1/workspace/:id/location/:locationId/member/:memberId` for a workspace + location + member. */
const memberUrl = (workspaceId: string, locationId: string, memberId: string) =>
  locationUrl(API_ROUTES.workspace.location.member, { id: workspaceId, locationId, memberId });

vi.mock('#/config/auth.ts', () => {
  return {
    auth: {
      api: {
        getSession: vi.fn(),
      },
    },
  };
});

const mockUserSession = (user?: Record<string, string>) => {
  const member = userFixtures.find((u) => u.id === USER_IDS.member);

  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: {
      id: member?.id,
      email: member?.email,
      ...user,
    },
  } as Awaited<ReturnType<typeof auth.api.getSession>>);
};

/**
 * RBAC matrix exercised below (one test per marked cell), so a change to the
 * route guards or the role/permission policy surfaces as a failing case:
 *
 * | Route                                    | owner | admin | member | non-member | unauth |
 * | ---------------------------------------- | ----- | ----- | ------ | ---------- | ------ |
 * | GET    /location            (loc:read)   |  200  |  200  |  200   |    404     |  401   |
 * | POST   /location            (loc:manage) |  201  |  201  |  403   |    404     |  401   |
 * | GET    /location/:lid       (loc:read)   |  200  |  200  |  200   |    404     |  401   |
 * | PATCH  /location/:lid       (loc:manage) |  200  |  200  |  403   |    404     |  401   |
 * | PUT    /location/:lid/default(loc:manage)|  200  |  200  |  403   |    404     |  401   |
 * | DELETE /location/:lid       (loc:manage) |  200  |  200  |  403   |    404     |  401   |
 *
 * `read` is held by every role; `manage` only by owner and admin. A non-member
 * (`outsider`) is authenticated but has no membership row, so
 * `requireWorkspaceAccess` returns WORKSPACE_NOT_FOUND before any permission check.
 */
describe('Workspace Location', () => {
  const WS = WORKSPACE_IDS.primary;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe(`${API_ROUTES.workspace.location.collection}`, () => {
    // --- GET /workspace/:id/location (list) ---

    // RBAC: gated on `workspace:location:read`, held by every role.
    test('GET allows the owner (has workspace:location:read)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(collectionUrl(WS)).send().expect(200);

      const locations = parseBody(WorkspaceLocationSchema.array(), response.body);

      // Ordered default-first, then newest.
      expect(locations).toHaveLength(2);
      expect(locations[0]?.isDefault).toBe(true);
    });

    test('GET allows a member (has workspace:location:read)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).get(collectionUrl(WS)).send().expect(200);

      parseBody(WorkspaceLocationSchema.array(), response.body);
    });

    test('GET hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({ id: USER_IDS.outsider });

      const response = await request(app).get(collectionUrl(WS)).send().expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(WORKSPACE_ERRORS.WORKSPACE_NOT_FOUND.message);
    });

    test('GET rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app).get(collectionUrl(WS)).send().expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(BASE_ERRORS.UNAUTHORIZED.message);
    });

    // Behavior
    test('GET returns an empty list for a workspace with no locations', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .get(collectionUrl(WORKSPACE_IDS.minimal))
        .send()
        .expect(200);

      const locations = parseBody(WorkspaceLocationSchema.array(), response.body);

      expect(locations).toHaveLength(0);
    });

    // --- POST /workspace/:id/location (create) ---

    // RBAC: gated on `workspace:location:manage`, held by owner and admin.
    test('POST allows the owner (has workspace:location:manage)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Warehouse' })
        .expect(201);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.name).toBe('Warehouse');
      expect(location.isDefault).toBe(false);
    });

    test('POST allows an admin (has workspace:location:manage)', async () => {
      mockUserSession({ id: USER_IDS.admin });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Studio' })
        .expect(201);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.name).toBe('Studio');
    });

    test('POST forbids a member (lacks workspace:location:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Warehouse' })
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe(BASE_ERRORS.FORBIDDEN.message);
    });

    test('POST hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({ id: USER_IDS.outsider });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Warehouse' })
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
    });

    test('POST rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Warehouse' })
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    test('POST rejects a payload missing the name with INVALID_INPUT', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).post(collectionUrl(WS)).send({}).expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe(VALIDATION_ERRORS.INVALID_INPUT.message);
      expect(error.details).toMatchObject({ name: expect.any(String) });
    });

    // --- Plan quota ---
    // The seeded plans are uncapped (see `planFixtures`), so each case narrows
    // the cap it needs.
    test('POST refuses a location once the plan cap is reached', async () => {
      // The workspace is seeded with two locations, so a cap of one is reached.
      await setFreePlanLimits({ location: 1 });
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Warehouse' })
        .expect(402);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('PLAN_LOCATION_LIMIT_REACHED');
    });

    test('POST reports FORBIDDEN, not the plan cap, for a member who lacks the permission', async () => {
      // A caller who may not create a location must never learn the workspace is
      // at its plan cap - that is billing state.
      await setFreePlanLimits({ location: 1 });
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Warehouse' })
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
    });

    test('POST still creates a location while the workspace is under the cap', async () => {
      await setFreePlanLimits({ location: 3 });
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .post(collectionUrl(WS))
        .send({ name: 'Warehouse' })
        .expect(201);

      expect(parseBody(WorkspaceLocationSchema, response.body).name).toBe('Warehouse');
    });
  });

  describe(`${API_ROUTES.workspace.location.byId}`, () => {
    // --- GET /workspace/:id/location/:locationId ---

    // RBAC: gated on `workspace:location:read`, held by every role.
    test('GET allows the owner (has workspace:location:read)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .get(itemUrl(WS, LOCATION_IDS.primaryDefault))
        .send()
        .expect(200);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.id).toBe(LOCATION_IDS.primaryDefault);
      expect(location.isDefault).toBe(true);
    });

    test('GET allows a member (has workspace:location:read)', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .get(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(200);

      parseBody(WorkspaceLocationSchema, response.body);
    });

    test('GET hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({ id: USER_IDS.outsider });

      const response = await request(app)
        .get(itemUrl(WS, LOCATION_IDS.primaryDefault))
        .send()
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
    });

    test('GET rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .get(itemUrl(WS, LOCATION_IDS.primaryDefault))
        .send()
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    // Behavior & validation
    test('GET returns LOCATION_NOT_FOUND for an unknown location', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(itemUrl(WS, LOCATION_IDS.missing)).send().expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('LOCATION_NOT_FOUND');
      expect(error.message).toBe(LOCATION_ERRORS.LOCATION_NOT_FOUND.message);
    });

    test('GET rejects a malformed location id with INVALID_INPUT', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(itemUrl(WS, 'not-a-uuid')).send().expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.details).toEqual({ locationId: 'Invalid UUID' });
    });

    // --- PATCH /workspace/:id/location/:locationId ---

    // RBAC: gated on `workspace:location:manage`, held by owner and admin.
    test('PATCH allows the owner (has workspace:location:manage)', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .patch(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send({ name: 'Renamed Branch' })
        .expect(200);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.name).toBe('Renamed Branch');
    });

    test('PATCH allows an admin (has workspace:location:manage)', async () => {
      mockUserSession({ id: USER_IDS.admin });

      const response = await request(app)
        .patch(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send({ name: 'Admin Renamed' })
        .expect(200);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.name).toBe('Admin Renamed');
    });

    test('PATCH forbids a member (lacks workspace:location:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .patch(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send({ name: 'Nope' })
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
    });

    test('PATCH rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .patch(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send({ name: 'Nope' })
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    // Behavior & validation
    test('PATCH with an empty payload returns the location unchanged', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .patch(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send({})
        .expect(200);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.id).toBe(LOCATION_IDS.primarySecondary);
      expect(location.name).toBe('Branch');
    });

    test('PATCH returns LOCATION_NOT_FOUND for an unknown location', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .patch(itemUrl(WS, LOCATION_IDS.missing))
        .send({ name: 'Renamed' })
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('LOCATION_NOT_FOUND');
    });
  });

  describe(`${API_ROUTES.workspace.location.default}`, () => {
    // --- PUT /workspace/:id/location/:locationId/default ---

    // RBAC: gated on `workspace:location:manage`, held by owner and admin.
    test('PUT allows the owner to promote a location to default', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .put(defaultUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(200);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.id).toBe(LOCATION_IDS.primarySecondary);
      expect(location.isDefault).toBe(true);
    });

    test('PUT allows an admin to promote a location to default', async () => {
      mockUserSession({ id: USER_IDS.admin });

      const response = await request(app)
        .put(defaultUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(200);

      const location = parseBody(WorkspaceLocationSchema, response.body);

      expect(location.isDefault).toBe(true);
    });

    test('PUT forbids a member (lacks workspace:location:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .put(defaultUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
    });

    test('PUT rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .put(defaultUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    // Behavior
    test('PUT returns LOCATION_NOT_FOUND for an unknown location', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .put(defaultUrl(WS, LOCATION_IDS.missing))
        .send()
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('LOCATION_NOT_FOUND');
    });
  });

  describe(`DELETE ${API_ROUTES.workspace.location.byId}`, () => {
    // --- DELETE /workspace/:id/location/:locationId ---

    // RBAC: gated on `workspace:location:manage`, held by owner and admin.
    test('DELETE allows the owner to delete a non-default location', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .delete(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('DELETE allows an admin to delete a non-default location', async () => {
      mockUserSession({ id: USER_IDS.admin });

      const response = await request(app)
        .delete(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('DELETE forbids a member (lacks workspace:location:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .delete(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
    });

    test('DELETE rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .delete(itemUrl(WS, LOCATION_IDS.primarySecondary))
        .send()
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    // Behavior
    test("DELETE refuses to delete the workspace's default location", async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .delete(itemUrl(WS, LOCATION_IDS.primaryDefault))
        .send()
        .expect(409);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('LOCATION_IS_DEFAULT');
      expect(error.message).toBe(LOCATION_ERRORS.LOCATION_IS_DEFAULT.message);
    });

    test('DELETE returns LOCATION_NOT_FOUND for an unknown location', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .delete(itemUrl(WS, LOCATION_IDS.missing))
        .send()
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('LOCATION_NOT_FOUND');
    });
  });

  describe(`PUT ${API_ROUTES.workspace.location.member}`, () => {
    // --- PUT /workspace/:id/location/:locationId/member/:memberId (assign) ---

    // RBAC: gated on `workspace:location:manage`, held by owner and admin.
    test('PUT forbids a member (lacks workspace:location:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .put(memberUrl(WS, LOCATION_IDS.primarySecondary, UNKNOWN_MEMBER_ID))
        .send()
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
    });

    test('PUT rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .put(memberUrl(WS, LOCATION_IDS.primarySecondary, UNKNOWN_MEMBER_ID))
        .send()
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    // Behavior
    test('PUT returns LOCATION_NOT_FOUND for an unknown location', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .put(memberUrl(WS, LOCATION_IDS.missing, UNKNOWN_MEMBER_ID))
        .send()
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('LOCATION_NOT_FOUND');
    });

    test('PUT returns MEMBER_NOT_FOUND when the member is not in the workspace', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .put(memberUrl(WS, LOCATION_IDS.primarySecondary, UNKNOWN_MEMBER_ID))
        .send()
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('MEMBER_NOT_FOUND');
    });
  });

  describe(`DELETE ${API_ROUTES.workspace.location.member}`, () => {
    // --- DELETE /workspace/:id/location/:locationId/member/:memberId (unassign) ---

    // RBAC: gated on `workspace:location:manage`, held by owner and admin.
    test('DELETE forbids a member (lacks workspace:location:manage) with FORBIDDEN', async () => {
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app)
        .delete(memberUrl(WS, LOCATION_IDS.primarySecondary, UNKNOWN_MEMBER_ID))
        .send()
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
    });

    test('DELETE rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .delete(memberUrl(WS, LOCATION_IDS.primarySecondary, UNKNOWN_MEMBER_ID))
        .send()
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
    });

    // Behavior: unassign is idempotent, so removing a member who isn't assigned
    // still succeeds - no known member id needed.
    test('DELETE is idempotent and returns 204 for an unassigned member', async () => {
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app)
        .delete(memberUrl(WS, LOCATION_IDS.primarySecondary, UNKNOWN_MEMBER_ID))
        .send()
        .expect(204);

      expect(response.body).toEqual({});
    });
  });
});
