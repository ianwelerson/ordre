import {
  checkSlugAvailability,
  findActivePlan,
  findUserWorkspaces,
  findWorkspace,
  respondWithWorkspace,
  toWorkspaceResponse,
} from './workspace.utils.ts';

// A single mutable db double, driven per test. `getDb()` resolves to it.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspace: { findFirst: vi.fn() },
      plan: { findFirst: vi.fn() },
    },
    select: vi.fn(),
  },
}));

vi.mock('#/config/db-context.ts', () => ({ getDb: () => mockDb }));

// `getSlugRestriction` is a pure lookup; mock it so each slug branch is deterministic.
const { getSlugRestriction } = vi.hoisted(() => ({ getSlugRestriction: vi.fn() }));
vi.mock('#/utils/slug-restrictions.ts', () => ({ getSlugRestriction }));

// The row shape `toWorkspaceResponse` accepts (a workspace row plus optional,
// role-scoped relations). The factories below build close-enough test doubles;
// casting to this keeps them from re-declaring Drizzle's exact column unions.
type WorkspaceArg = Parameters<typeof toWorkspaceResponse>[0];

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';

/** A workspace row, as Drizzle returns it (Date timestamps). */
const workspaceRow = (overrides: Record<string, unknown> = {}) => ({
  id: WORKSPACE_ID,
  slug: 'test-workspace',
  name: 'Test Workspace',
  description: 'A workspace',
  logo: null,
  type: 'individual',
  industry: 'other',
  billingEmail: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-02-02T00:00:00.000Z'),
  ...overrides,
});

const memberRow = () => ({
  id: 'member-1',
  userId: 'user-1',
  workspaceId: WORKSPACE_ID,
  displayName: 'Casey',
  title: null,
  role: 'owner' as const,
  status: 'active' as const,
  phone: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
});

const planRow = () => ({
  id: 'plan-1',
  code: 'free:founding',
  tier: 'free' as const,
  status: 'active' as const,
  title: 'Free',
  description: 'Free plan',
  entitlements: { limits: { seat: 2, location: 1 } },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
});

const subscriptionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub-1',
  workspaceId: WORKSPACE_ID,
  planId: 'plan-1',
  status: 'active' as const,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  plan: planRow(),
  ...overrides,
});

describe('controllers/workspace/workspace.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toWorkspaceResponse', () => {
    it('maps the base columns and omits every relation when none is loaded', () => {
      const result = toWorkspaceResponse(workspaceRow() as WorkspaceArg);

      expect(result).toMatchObject({
        id: WORKSPACE_ID,
        slug: 'test-workspace',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
      });
      expect(result).not.toHaveProperty('members');
      expect(result).not.toHaveProperty('locations');
      expect(result).not.toHaveProperty('invites');
      expect(result).not.toHaveProperty('subscription');
    });

    it('embeds members / locations / invites when those relations are present', () => {
      const result = toWorkspaceResponse({
        ...workspaceRow(),
        members: [memberRow()],
        locations: [],
        invites: [],
      } as WorkspaceArg);

      expect(result.members).toHaveLength(1);
      expect(result.locations).toEqual([]);
      expect(result.invites).toEqual([]);
    });

    it('unwraps the single active subscription', () => {
      const result = toWorkspaceResponse({
        ...workspaceRow(),
        subscription: [subscriptionRow({ cancelAtPeriodEnd: true })],
      } as WorkspaceArg);

      expect(result.subscription).toMatchObject({ id: 'sub-1', cancelAtPeriodEnd: true });
      expect(result.subscription?.plan).toMatchObject({ code: 'free:founding' });
    });

    it('omits `subscription` when the filtered relation is an empty array', () => {
      const result = toWorkspaceResponse({ ...workspaceRow(), subscription: [] } as WorkspaceArg);

      expect(result).not.toHaveProperty('subscription');
    });

    it('reports cancelAtPeriodEnd false when no cancellation is scheduled', () => {
      const result = toWorkspaceResponse({
        ...workspaceRow(),
        subscription: [subscriptionRow({ cancelAtPeriodEnd: false })],
      } as WorkspaceArg);

      expect(result.subscription?.cancelAtPeriodEnd).toBe(false);
    });
  });

  describe('checkSlugAvailability', () => {
    it('returns a reserved-slug error before hitting the database', async () => {
      getSlugRestriction.mockReturnValueOnce('RESERVED');

      const result = await checkSlugAvailability('admin');

      expect(result?.body).toMatchObject({ code: 'WORKSPACE_SLUG_RESERVED' });
      expect(mockDb.query.workspace.findFirst).not.toHaveBeenCalled();
    });

    it('returns WORKSPACE_SLUG_ALREADY_EXISTS when another workspace owns the slug', async () => {
      getSlugRestriction.mockReturnValueOnce(null);
      mockDb.query.workspace.findFirst.mockResolvedValueOnce({ id: 'other-workspace' });

      const result = await checkSlugAvailability('taken-slug');

      expect(result?.body).toMatchObject({ code: 'WORKSPACE_SLUG_ALREADY_EXISTS' });
    });

    it('returns null when the slug is free', async () => {
      getSlugRestriction.mockReturnValueOnce(null);
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);

      expect(await checkSlugAvailability('free-slug')).toBeNull();
    });

    it('ignores the workspace being updated (excludeId) as its own collision', async () => {
      getSlugRestriction.mockReturnValueOnce(null);
      mockDb.query.workspace.findFirst.mockResolvedValueOnce({ id: WORKSPACE_ID });

      expect(await checkSlugAvailability('keep-slug', WORKSPACE_ID)).toBeNull();
    });
  });

  describe('respondWithWorkspace', () => {
    it('returns 200 with the mapped workspace', async () => {
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(workspaceRow());

      const result = await respondWithWorkspace('owner', {} as never);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({ id: WORKSPACE_ID });
    });

    it('returns WORKSPACE_NOT_FOUND when no workspace matches', async () => {
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);

      const result = await respondWithWorkspace('owner', {} as never);

      expect(result.body).toMatchObject({ code: 'WORKSPACE_NOT_FOUND' });
    });
  });

  describe('findActivePlan / findWorkspace / findUserWorkspaces', () => {
    it('findActivePlan returns the plan the query resolves', async () => {
      mockDb.query.plan.findFirst.mockResolvedValueOnce(planRow());

      expect(await findActivePlan('free')).toMatchObject({ tier: 'free' });
    });

    it('findWorkspace returns the row the query resolves', async () => {
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(workspaceRow());

      expect(await findWorkspace('member', {} as never)).toMatchObject({ id: WORKSPACE_ID });
    });

    it('findUserWorkspaces returns the summary rows the query resolves', async () => {
      const summaries = [{ id: WORKSPACE_ID, slug: 'test-workspace', name: 'Test Workspace' }];
      mockDb.select.mockReturnValue({
        from: () => ({
          innerJoin: () => ({ where: () => ({ orderBy: () => Promise.resolve(summaries) }) }),
        }),
      });

      expect(await findUserWorkspaces('user-1')).toEqual(summaries);
    });
  });
});
