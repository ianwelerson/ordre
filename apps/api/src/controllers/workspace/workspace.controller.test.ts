import type { MemberContext, WorkspaceContext } from '#/types/context.ts';
import { PG_ERROR_CODES } from '#/utils/db-error.ts';

import {
  workspaceCreate,
  workspaceDelete,
  workspaceGetById,
  workspaceSlugGetAvailability,
  workspaceUpdate,
} from './workspace.controller.ts';

// A single mutable db double, driven per test. `getDb()` (used by both the
// controller and workspace.utils) resolves to it, so mocking one module covers
// every query path exercised here.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    query: {
      workspace: { findFirst: vi.fn() },
      plan: { findFirst: vi.fn() },
    },
    execute: vi.fn(),
    transaction: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('#/config/db-context.ts', () => ({ getDb: () => mockDb }));

vi.mock('#/config/logger.ts', () => ({
  logger: { error: vi.fn(), child: () => ({ info: vi.fn(), error: vi.fn() }) },
}));

/** A Postgres unique-violation, as node-postgres surfaces it. */
const uniqueViolation = () =>
  Object.assign(new Error('duplicate key'), {
    code: PG_ERROR_CODES.UNIQUE_VIOLATION,
  });

/** `delete(...).where(...).returning()` returning `rows`. */
const mockDelete = (rows: unknown[]) => {
  mockDb.delete.mockReturnValue({ where: () => ({ returning: () => Promise.resolve(rows) }) });
};

/** `update(...).set(...).where(...).returning()` resolving with `rows` (or rejecting). */
const mockUpdate = (result: unknown[] | Error) => {
  const returning = () =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  mockDb.update.mockReturnValue({ set: () => ({ where: () => ({ returning }) }) });
};

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const workspace: WorkspaceContext = { id: WORKSPACE_ID, name: 'Workspace' };
const member: MemberContext = { id: 'member-1', role: 'owner', locale: 'en' };

const validCreatePayload = {
  name: 'Test',
  slug: 'valid-workspace',
  type: 'individual',
  industry: 'other',
} as Parameters<typeof workspaceCreate>[1];

const sessionUser = {
  id: 'user-1',
  email: 'owner@example.com',
  fullName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
};

describe('controllers/workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('workspaceSlugGetAvailability', () => {
    it('returns INTERNAL_ERROR when the availability query throws', async () => {
      mockDb.execute.mockRejectedValue(new Error('db down'));

      const result = await workspaceSlugGetAvailability('valid-workspace');

      expect(result.status).toBe(500);
    });

    it('reports a reserved slug as unavailable, without querying for it', async () => {
      const result = await workspaceSlugGetAvailability('admin');

      expect(result.body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_RESERVED' });
      expect(mockDb.execute).not.toHaveBeenCalled();
    });

    it('reports a protected slug as unavailable', async () => {
      const result = await workspaceSlugGetAvailability('adidas');

      expect(result.body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_PROTECTED' });
    });

    it('reports a banned slug as unavailable', async () => {
      const result = await workspaceSlugGetAvailability('fuck');

      expect(result.body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_BANNED' });
    });

    it('checks the restriction against the transformed slug, not the raw input', async () => {
      const result = await workspaceSlugGetAvailability('Admin');

      expect(result.body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_RESERVED' });
      expect(mockDb.execute).not.toHaveBeenCalled();
    });

    it('reports a taken slug as unavailable', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ taken: true }] });

      const result = await workspaceSlugGetAvailability('valid-workspace');

      expect(result.body).toEqual({ available: false, reason: 'WORKSPACE_SLUG_ALREADY_EXISTS' });
    });

    it('reports a free slug as available, with no reason', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [{ taken: false }] });

      const result = await workspaceSlugGetAvailability('valid-workspace');

      expect(result.body).toEqual({ available: true, reason: null });
    });
  });

  describe('workspaceCreate', () => {
    /** A plan row, as `findActivePlan` returns it (Date timestamps). */
    const planRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'plan-1',
      code: 'free:founding',
      tier: 'free',
      status: 'active',
      title: 'Free',
      description: 'Get started',
      entitlements: { limits: { seat: 2, location: 1 } },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      ...overrides,
    });

    it('maps a concurrent unique violation to WORKSPACE_SLUG_ALREADY_EXISTS', async () => {
      // Pre-check passes, but the write loses a race and the unique index fires.
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);
      mockDb.query.plan.findFirst.mockResolvedValueOnce(planRow());
      mockDb.transaction.mockRejectedValueOnce(uniqueViolation());

      const result = await workspaceCreate(sessionUser, validCreatePayload);

      expect(result.status).toBe(409);
    });

    it('returns WORKSPACE_CREATE_FAILED when no active free plan is seeded', async () => {
      // Pre-check passes, but the plan catalog has no active free plan.
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);
      mockDb.query.plan.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceCreate(sessionUser, validCreatePayload);

      expect(result.body).toMatchObject({ code: 'WORKSPACE_CREATE_FAILED' });
      // The transaction is never opened when the plan can't be resolved.
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.query.workspace.findFirst.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceCreate(sessionUser, validCreatePayload);

      expect(result.status).toBe(500);
    });

    it('returns WORKSPACE_CREATE_FAILED when the created workspace cannot be read back', async () => {
      // Pre-check: no existing slug. Transaction succeeds, but the re-read finds
      // nothing (findWorkspace -> undefined).
      mockDb.query.workspace.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockDb.query.plan.findFirst.mockResolvedValueOnce(planRow());
      mockDb.transaction.mockResolvedValueOnce(WORKSPACE_ID);

      const result = await workspaceCreate(sessionUser, validCreatePayload);

      expect(result.body).toMatchObject({ code: 'WORKSPACE_CREATE_FAILED' });
    });
  });

  describe('workspaceGetById', () => {
    it('returns WORKSPACE_NOT_FOUND when no workspace matches', async () => {
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceGetById(member, WORKSPACE_ID);

      expect(result.status).toBe(404);
    });
  });

  describe('workspaceDelete', () => {
    it('returns WORKSPACE_NOT_FOUND when no row is deleted', async () => {
      mockDelete([]);

      const result = await workspaceDelete(WORKSPACE_ID);

      expect(result.status).toBe(404);
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockDb.delete.mockImplementation(() => {
        throw new Error('db down');
      });

      const result = await workspaceDelete(WORKSPACE_ID);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceUpdate', () => {
    // No "invalid workspace id" case: the id comes from the workspace context that
    // `requireWorkspaceAccess` resolved from the database, not from client input.
    it('returns WORKSPACE_NOT_FOUND when a valid id matches no row', async () => {
      mockUpdate([]);

      const result = await workspaceUpdate(workspace, member, { name: 'New' } as Parameters<
        typeof workspaceUpdate
      >[2]);

      expect(result.status).toBe(404);
    });

    it('maps a concurrent unique violation to WORKSPACE_SLUG_ALREADY_EXISTS', async () => {
      mockUpdate(uniqueViolation());

      const result = await workspaceUpdate(workspace, member, { name: 'New' } as Parameters<
        typeof workspaceUpdate
      >[2]);

      expect(result.status).toBe(409);
    });

    it('returns INTERNAL_ERROR on an unexpected error', async () => {
      mockUpdate(new Error('db down'));

      const result = await workspaceUpdate(workspace, member, { name: 'New' } as Parameters<
        typeof workspaceUpdate
      >[2]);

      expect(result.status).toBe(500);
    });
  });
});
