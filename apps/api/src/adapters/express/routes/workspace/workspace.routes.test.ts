import { app } from '#/adapters/express/server.ts';
import { auth } from '#/config/auth.ts';
import { setFeature } from '#/test/db.ts';
import { USER_IDS, userFixtures, WORKSPACE_IDS, workspaceFixtures } from '#/test/fixtures.ts';
import { ownerDb } from '#/test/owner-db.ts';
import { parseBody } from '#/utils/testing.ts';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { z } from 'zod';

import { API_BASE_PATH, API_ROUTES, buildPath } from '@ordre/core/constants';
import { errorMessage } from '@ordre/core/errors';
import {
  ResponseErrorSchema,
  WorkspaceSchema,
  WorkspaceSlugAvailabilitySchema,
  WorkspaceSummarySchema,
} from '@ordre/core/schemas';

const BASE = `${API_BASE_PATH}${API_ROUTES.workspace.collection}`;

const itemUrl = (id: string) => `${API_BASE_PATH}${buildPath(API_ROUTES.workspace.byId, { id })}`;
const slugUrl = (slug: string) =>
  `${API_BASE_PATH}${buildPath(API_ROUTES.workspace.bySlug, { slug })}`;
const slugAvailabilityUrl = (slug: string) =>
  `${API_BASE_PATH}${buildPath(API_ROUTES.workspace.slugAvailability, { slug })}`;

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
 * | Route                         | owner | admin | member | non-member | unauth |
 * | ----------------------------- | ----- | ----- | ------ | ---------- | ------ |
 * | GET  /slug/:slug/availability |  200  |  200  |  200   |    200     |  200   |
 * | GET  /                        |  200  |  200  |  200   |    200     |  401   |
 * | POST /                        |  201  |  201  |  201   |    201     |  401   |
 * | GET  /:id  (workspace:read)   |  200  |  200  |  200   |    404     |  401   |
 * | GET  /:slug(workspace:read)   |  200  |  200  |  200   |    404     |  401   |
 * | DEL  /:id (workspace:delete)  |  200  |  403  |  403   |    404     |  401   |
 * | PATCH /:id(workspace:update)  |  200  |  200  |  403   |    404     |  401   |
 *
 * A non-member (`outsider`) is authenticated but has no membership row, so
 * `requireWorkspaceAccess` returns WORKSPACE_NOT_FOUND to avoid leaking existence.
 */
describe('Workspace', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe(API_ROUTES.workspace.collection, () => {
    // --- GET /workspace (list the user's workspaces) ---

    // RBAC: gated on authentication only; the listing is scoped to the caller's
    // own active memberships, so no per-workspace access check applies.
    test('GET lists every workspace the user is an active member of', async () => {
      // The owner belongs to both seeded workspaces (primary + minimal).
      mockUserSession({ id: USER_IDS.owner });

      const response = await request(app).get(BASE).send().expect(200);

      const workspaces = parseBody(z.array(WorkspaceSummarySchema), response.body);

      expect(workspaces).toHaveLength(2);
      expect(workspaces.map((w) => w.slug).sort()).toEqual(
        ['minimal-workspace', 'test-workspace'].sort()
      );
    });

    test('GET returns only the workspaces the caller belongs to', async () => {
      // The plain member belongs to the primary workspace only.
      mockUserSession({ id: USER_IDS.member });

      const response = await request(app).get(BASE).send().expect(200);

      const workspaces = parseBody(z.array(WorkspaceSummarySchema), response.body);

      expect(workspaces).toHaveLength(1);
      expect(workspaces[0]?.slug).toBe('test-workspace');
    });

    test('GET returns an empty array for a user with no workspaces', async () => {
      // The outsider is authenticated but has no membership rows.
      mockUserSession({ id: USER_IDS.outsider });

      const response = await request(app).get(BASE).send().expect(200);

      const workspaces = parseBody(z.array(WorkspaceSummarySchema), response.body);

      expect(workspaces).toEqual([]);
    });

    test('GET rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app).get(BASE).send().expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(errorMessage('UNAUTHORIZED'));
    });

    // --- POST /workspace (create) ---

    // RBAC: create is gated on authentication only (no membership required).
    test('POST allows an authenticated user to create a workspace', async () => {
      mockUserSession();

      const slug = `test-${Date.now()}`;

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug,
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
        })
        .expect(201);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.slug).toBe(slug);
      expect(workspace.name).toBe('Test');
      expect(workspace.subscription?.status).toBe('active');
      expect(workspace.subscription?.plan.code).toBe('free:founding');
    });

    test('POST queues a self-contained email row and a contact sync', async () => {
      mockUserSession();

      const slug = `outbox-${Date.now()}`;

      await request(app)
        .post(BASE)
        .send({ name: 'Outbox', slug, type: 'individual', industry: 'other' })
        .expect(201);

      // Written through the request's own connection as `ordre_app`, so this also
      // proves the runtime role has INSERT on `outbox`.
      const rows = (
        await ownerDb.execute<{
          channel: string;
          topic: string;
          payload: { to: string; locale: string; variables: Record<string, unknown> };
        }>(sql`SELECT channel, topic, payload FROM outbox ORDER BY channel::text`)
      ).rows;

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ channel: 'audience', topic: 'contact:sync' });
      expect(rows[0]?.payload.variables).toMatchObject({
        contact_segments: ['all-accounts', 'workspace-owner', 'workspace-member'],
        contact_topics: [],
      });
      expect(rows[1]).toMatchObject({ channel: 'email', topic: 'workspace:created' });

      // Self-contained by design: the worker has no user context and cannot read
      // tenant tables, so everything the template renders lives in the payload.
      const member = userFixtures.find((user) => user.id === USER_IDS.member);

      expect(rows[1]?.payload.to).toBe(member?.email);
      expect(rows[1]?.payload.variables).toMatchObject({
        workspace_name: 'Outbox',
        workspace_plan: expect.any(String),
      });

      // Frozen at write time, so the worker renders in the language the creator
      // was using rather than negotiating one it has no request for.
      expect(rows[1]?.payload).toMatchObject({ locale: 'en' });
    });

    test('POST writes no outbox row when the request fails', async () => {
      mockUserSession();

      // A duplicate slug makes the handler return 409 and the transaction roll
      // back, taking the outbox row with it, so no email is sent about a
      // workspace that does not exist.
      await request(app)
        .post(BASE)
        .send({ name: 'Test', slug: 'test-workspace', type: 'individual', industry: 'other' })
        .expect(409);

      const [row] = (await ownerDb.execute<{ count: string }>(sql`SELECT count(*) FROM outbox`))
        .rows;

      expect(Number(row?.count)).toBe(0);
    });

    test('POST allows a non-member (create requires only authentication)', async () => {
      mockUserSession({ id: USER_IDS.outsider });

      const slug = `outsider-${Date.now()}`;

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug,
          type: 'individual',
          industry: 'other',
        })
        .expect(201);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.slug).toBe(slug);
    });

    test('POST rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const slug = `test-${Date.now()}`;

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug,
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
        })
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(errorMessage('UNAUTHORIZED'));
    });

    // --- Feature switch ---
    test('POST refuses a workspace while `workspace-creation` is off', async () => {
      await setFeature('workspace-creation', false);
      mockUserSession();

      const response = await request(app)
        .post(BASE)
        .send({ name: 'Test', slug: `test-${Date.now()}`, type: 'individual', industry: 'other' })
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FEATURE_WORKSPACE_CREATION_DISABLED');
      expect(error.message).toBe(errorMessage('FEATURE_WORKSPACE_CREATION_DISABLED'));
    });

    test('POST still refuses an unauthenticated caller with UNAUTHORIZED while the switch is on', async () => {
      await setFeature('workspace-creation', true);

      const response = await request(app).post(BASE).send({}).expect(401);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('UNAUTHORIZED');
    });

    // Behavior & validation
    test('POST creates a workspace with optional fields and returns the created resource', async () => {
      mockUserSession();

      const slug = `test-${Date.now()}`;

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug,
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
          logo: 'https://test.com/logo.png',
          billingEmail: 'test@ordre.app',
        })
        .expect(201);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.slug).toBe(slug);
      expect(workspace.name).toBe('Test');
      expect(workspace.logo).toBe('https://test.com/logo.png');
      expect(workspace.billingEmail).toBe('test@ordre.app');
    });

    test('POST omits optional fields absent from the payload', async () => {
      mockUserSession();

      const slug = `minimal-${Date.now()}`;

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug,
          type: 'individual',
          industry: 'other',
        })
        .expect(201);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.slug).toBe(slug);
      expect(workspace.description).toBeNull();
      expect(workspace.logo).toBeNull();
      expect(workspace.billingEmail).toBeNull();
    });

    test('POST rejects a payload missing required fields with INVALID_INPUT', async () => {
      mockUserSession();

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe(errorMessage('INVALID_INPUT'));
      expect(error.details).toMatchObject({
        slug: expect.any(String),
        type: expect.any(String),
        industry: expect.any(String),
      });
    });

    test('POST rejects a non-string slug with INVALID_INPUT', async () => {
      mockUserSession();

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug: 123,
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe(errorMessage('INVALID_INPUT'));
      expect(error.details).toMatchObject({
        slug: expect.any(String),
      });
    });

    test('POST rejects an already-taken slug with WORKSPACE_SLUG_ALREADY_EXISTS', async () => {
      mockUserSession();

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug: workspaceFixtures[0]?.slug,
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
        })
        .expect(409);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_ALREADY_EXISTS');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_ALREADY_EXISTS'));
    });

    test('POST rejects a protected slug with WORKSPACE_SLUG_PROTECTED', async () => {
      mockUserSession();

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug: 'coca-cola',
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_PROTECTED');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_PROTECTED'));
    });

    test('POST rejects a reserved slug with WORKSPACE_SLUG_RESERVED', async () => {
      mockUserSession();

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug: 'admin',
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_RESERVED');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_RESERVED'));
    });

    test('POST rejects a banned slug with WORKSPACE_SLUG_BANNED', async () => {
      mockUserSession();

      const response = await request(app)
        .post(BASE)
        .send({
          name: 'Test',
          slug: 'b1tch',
          description: 'Test workspace',
          type: 'individual',
          industry: 'other',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_BANNED');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_BANNED'));
    });

    // --- DELETE /workspace/:id ---

    // RBAC: gated on `workspace:delete`, held only by the owner.
    test('DELETE allows the owner (has workspace:delete)', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .delete(`${BASE}/${WORKSPACE_IDS.primary}`)
        .send({})
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('DELETE forbids an admin (lacks workspace:delete) with FORBIDDEN', async () => {
      mockUserSession({
        id: USER_IDS.admin,
      });

      const response = await request(app)
        .delete(`${BASE}/${WORKSPACE_IDS.primary}`)
        .send({})
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe(errorMessage('FORBIDDEN'));
    });

    test('DELETE forbids a member (lacks workspace:delete) with FORBIDDEN', async () => {
      mockUserSession({
        id: USER_IDS.member,
      });

      const response = await request(app)
        .delete(`${BASE}/${WORKSPACE_IDS.primary}`)
        .send({})
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe(errorMessage('FORBIDDEN'));
    });

    test('DELETE hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({
        id: USER_IDS.outsider,
      });

      const response = await request(app)
        .delete(`${BASE}/${WORKSPACE_IDS.primary}`)
        .send({})
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });

    test('DELETE rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .delete(`${BASE}/${WORKSPACE_IDS.primary}`)
        .send({})
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(errorMessage('UNAUTHORIZED'));
    });

    // Behavior & validation
    test('DELETE returns WORKSPACE_NOT_FOUND for an unknown workspace', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .delete(`${BASE}/${WORKSPACE_IDS.missing}`)
        .send({})
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });

    test('DELETE rejects a malformed id with INVALID_INPUT', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).delete(`${BASE}/c410d83e`).send({}).expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe(errorMessage('INVALID_INPUT'));
      expect(error.details).toEqual({ id: 'validation.uuid' });
    });

    // --- PATCH /workspace/:id ---

    // RBAC: gated on `workspace:update`, held by the owner and admin.
    test('PATCH allows the owner (has workspace:update)', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          name: 'Updated Workspace',
        })
        .expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      // Updated Field
      expect(workspace.name).toBe('Updated Workspace');

      // Non-updated fields
      expect(workspace.slug).toBe(workspaceFixtures[0]?.slug);
      expect(workspace.description).toBe(workspaceFixtures[0]?.description);
    });

    test('PATCH allows an admin (has workspace:update)', async () => {
      mockUserSession({
        id: USER_IDS.admin,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          name: 'Admin Updated Workspace',
        })
        .expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.name).toBe('Admin Updated Workspace');
    });

    test('PATCH forbids a member (lacks workspace:update) with FORBIDDEN', async () => {
      mockUserSession({
        id: USER_IDS.member,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          name: 'Updated Workspace',
        })
        .expect(403);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe(errorMessage('FORBIDDEN'));
    });

    test('PATCH hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({
        id: USER_IDS.outsider,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          name: 'Updated Workspace',
        })
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });

    test('PATCH rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          name: 'Updated Workspace',
        })
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(errorMessage('UNAUTHORIZED'));
    });

    // Behavior & validation
    test('PATCH updates optional fields and returns the updated resource', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          logo: 'https://test.com/logo.png',
          billingEmail: 'test@ordre.app',
        })
        .expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.logo).toBe('https://test.com/logo.png');
      expect(workspace.billingEmail).toBe('test@ordre.app');
    });

    test('PATCH rejects a non-string slug with INVALID_INPUT', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          slug: 123,
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe(errorMessage('INVALID_INPUT'));
      expect(error.details).toMatchObject({
        slug: expect.any(String),
      });
    });

    test('PATCH rejects an already-taken slug with WORKSPACE_SLUG_ALREADY_EXISTS', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          slug: workspaceFixtures[1]?.slug,
        })
        .expect(409);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_ALREADY_EXISTS');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_ALREADY_EXISTS'));
    });

    test('PATCH rejects a protected slug with WORKSPACE_SLUG_PROTECTED', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          slug: 'coca-cola',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_PROTECTED');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_PROTECTED'));
    });

    test('PATCH rejects a reserved slug with WORKSPACE_SLUG_RESERVED', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          slug: 'admin',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_RESERVED');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_RESERVED'));
    });

    test('PATCH rejects a banned slug with WORKSPACE_SLUG_BANNED', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          slug: 'b1tch',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_SLUG_BANNED');
      expect(error.message).toBe(errorMessage('WORKSPACE_SLUG_BANNED'));
    });

    test('PATCH accepts the workspace keeping its own slug', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({
          slug: workspaceFixtures[0]?.slug,
        })
        .expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.slug).toBe(workspaceFixtures[0]?.slug);
    });

    test('PATCH with an empty payload returns the workspace unchanged', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${workspaceFixtures[0]?.id}`)
        .send({})
        .expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.name).toBe(workspaceFixtures[0]?.name);
      expect(workspace.slug).toBe(workspaceFixtures[0]?.slug);
    });

    test('PATCH returns WORKSPACE_NOT_FOUND for an unknown workspace', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/${WORKSPACE_IDS.missing}`)
        .send({
          name: 'Updated Workspace',
        })
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });

    test('PATCH rejects a malformed id with INVALID_INPUT', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .patch(`${BASE}/c410d83e`)
        .send({
          name: 'Updated Workspace',
        })
        .expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe(errorMessage('INVALID_INPUT'));
      expect(error.details).toEqual({ id: 'validation.uuid' });
    });
  });

  describe(`${API_ROUTES.workspace.byId}`, () => {
    // RBAC: gated on `workspace:read`, held by every role (owner, admin, member).

    test('GET allows the owner (has workspace:read)', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.primary)).send().expect(200);

      parseBody(WorkspaceSchema, response.body);
    });

    test('GET allows an admin (has workspace:read)', async () => {
      mockUserSession({
        id: USER_IDS.admin,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.primary)).send().expect(200);

      parseBody(WorkspaceSchema, response.body);
    });

    test('GET allows a member (has workspace:read)', async () => {
      mockUserSession({
        id: USER_IDS.member,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.primary)).send().expect(200);

      parseBody(WorkspaceSchema, response.body);
    });

    // The suspended member holds the `member` role, so `workspace:read` would let
    // them through - only the membership status stops them.
    test('GET rejects a suspended member with MEMBER_SELF_SUSPENDED', async () => {
      mockUserSession({
        id: USER_IDS.suspended,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.primary)).send().expect(403);

      expect(parseBody(ResponseErrorSchema, response.body).code).toBe('MEMBER_SELF_SUSPENDED');
    });

    test('GET hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({
        id: USER_IDS.outsider,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.primary)).send().expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });

    test('GET rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app).get(itemUrl(WORKSPACE_IDS.primary)).send().expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(errorMessage('UNAUTHORIZED'));
    });

    // Behavior & validation
    test('GET omits optional fields for a workspace without them', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.minimal)).send().expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.description).toBeNull();
      expect(workspace.logo).toBeNull();
      expect(workspace.billingEmail).toBeNull();
    });

    test('GET embeds the active subscription with its plan', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.primary)).send().expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.subscription?.status).toBe('active');
      expect(workspace.subscription?.plan.code).toBe('free:founding');
    });

    test('GET omits the subscription for a workspace without an active one', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.minimal)).send().expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.subscription).toBeUndefined();
    });

    test('GET returns WORKSPACE_NOT_FOUND for an unknown id', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).get(itemUrl(WORKSPACE_IDS.missing)).send().expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });

    test('GET rejects a malformed id with INVALID_INPUT', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).get(itemUrl('c410d83e')).send().expect(400);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.message).toBe(errorMessage('INVALID_INPUT'));
      expect(error.details).toEqual({ id: 'validation.uuid' });
    });
  });

  describe(`${API_ROUTES.workspace.bySlug}`, () => {
    // RBAC: same guard chain as GET by id - gated on `workspace:read`.

    test('GET allows the owner (has workspace:read)', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .get(slugUrl(workspaceFixtures[0]!.slug))
        .send()
        .expect(200);

      parseBody(WorkspaceSchema, response.body);
    });

    test('GET allows an admin (has workspace:read)', async () => {
      mockUserSession({
        id: USER_IDS.admin,
      });

      const response = await request(app)
        .get(slugUrl(workspaceFixtures[0]!.slug))
        .send()
        .expect(200);

      parseBody(WorkspaceSchema, response.body);
    });

    test('GET allows a member (has workspace:read)', async () => {
      mockUserSession({
        id: USER_IDS.member,
      });

      const response = await request(app)
        .get(slugUrl(workspaceFixtures[0]!.slug))
        .send()
        .expect(200);

      parseBody(WorkspaceSchema, response.body);
    });

    test('GET hides the workspace from a non-member with WORKSPACE_NOT_FOUND', async () => {
      mockUserSession({
        id: USER_IDS.outsider,
      });

      const response = await request(app)
        .get(slugUrl(workspaceFixtures[0]!.slug))
        .send()
        .expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });

    test('GET rejects an unauthenticated request with UNAUTHORIZED', async () => {
      const response = await request(app)
        .get(slugUrl(workspaceFixtures[0]!.slug))
        .send()
        .expect(401);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe(errorMessage('UNAUTHORIZED'));
    });

    // Behavior & validation
    test('GET omits optional fields for a workspace without them', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app)
        .get(slugUrl(workspaceFixtures[1]!.slug))
        .send()
        .expect(200);

      const workspace = parseBody(WorkspaceSchema, response.body);

      expect(workspace.description).toBeNull();
      expect(workspace.logo).toBeNull();
      expect(workspace.billingEmail).toBeNull();
    });

    test('GET returns WORKSPACE_NOT_FOUND for an unknown slug', async () => {
      mockUserSession({
        id: USER_IDS.owner,
      });

      const response = await request(app).get(slugUrl('not-found')).send().expect(404);

      const error = parseBody(ResponseErrorSchema, response.body);

      expect(error.code).toBe('WORKSPACE_NOT_FOUND');
      expect(error.message).toBe(errorMessage('WORKSPACE_NOT_FOUND'));
    });
  });

  describe(`${API_ROUTES.workspace.slugAvailability}`, () => {
    // RBAC: public route - mounted before `authenticate`, so no session required.

    test('GET is public and works without authentication', async () => {
      const response = await request(app)
        .get(slugAvailabilityUrl(workspaceFixtures[0]!.slug))
        .send()
        .expect(200);

      const body = parseBody(WorkspaceSlugAvailabilitySchema, response.body);

      expect(body.available).toBe(false);
    });

    // Behavior
    test('GET reports a taken slug as unavailable', async () => {
      mockUserSession();

      const response = await request(app)
        .get(slugAvailabilityUrl(workspaceFixtures[0]!.slug))
        .send()
        .expect(200);

      const body = parseBody(WorkspaceSlugAvailabilitySchema, response.body);

      expect(body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_ALREADY_EXISTS' });
    });

    test('GET reports a free slug as available, with no reason', async () => {
      mockUserSession();

      const response = await request(app)
        .get(slugAvailabilityUrl('non-existing'))
        .send()
        .expect(200);

      const body = parseBody(WorkspaceSlugAvailabilitySchema, response.body);

      expect(body).toEqual({ available: true, reason: null });
    });

    test('GET separates a reserved slug from a taken one', async () => {
      mockUserSession();

      const response = await request(app).get(slugAvailabilityUrl('admin')).send().expect(200);

      const body = parseBody(WorkspaceSlugAvailabilitySchema, response.body);

      expect(body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_RESERVED' });
    });

    test('GET reports a protected slug with its own reason', async () => {
      mockUserSession();

      const response = await request(app).get(slugAvailabilityUrl('adidas')).send().expect(200);

      const body = parseBody(WorkspaceSlugAvailabilitySchema, response.body);

      expect(body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_PROTECTED' });
    });

    test('GET reports a banned slug with its own reason', async () => {
      mockUserSession();

      const response = await request(app).get(slugAvailabilityUrl('fuck')).send().expect(200);

      const body = parseBody(WorkspaceSlugAvailabilitySchema, response.body);

      expect(body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_BANNED' });
    });
  });
});
