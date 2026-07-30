import type { WorkspaceMemberContext } from '#/types/context.ts';
import { PG_ERROR_CODES } from '#/utils/db-error.ts';

import {
  workspaceCreate,
  workspaceDelete,
  workspaceGetById,
  workspaceSlugExists,
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
vi.mock('#/config/logger.ts', () => ({ logger: { error: vi.fn() } }));

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
const member: WorkspaceMemberContext = { id: 'member-1', workspaceId: WORKSPACE_ID, role: 'owner' };

const validCreatePayload = {
  name: 'Test',
  slug: 'valid-workspace',
  type: 'individual',
  industry: 'other',
} as Parameters<typeof workspaceCreate>[1];

describe('controllers/workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('workspaceSlugExists', () => {
    it('returns SOMETHING_WRONG when the availability query throws', async () => {
      mockDb.execute.mockRejectedValue(new Error('db down'));

      const result = await workspaceSlugExists('valid-workspace');

      expect(result.status).toBe(500);
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
      entitlements: { limits: { member: 1, location: 1 } },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      ...overrides,
    });

    it('maps a concurrent unique violation to SLUG_ALREADY_EXISTS', async () => {
      // Pre-check passes, but the write loses a race and the unique index fires.
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);
      mockDb.query.plan.findFirst.mockResolvedValueOnce(planRow());
      mockDb.transaction.mockRejectedValueOnce(uniqueViolation());

      const result = await workspaceCreate('user-1', validCreatePayload);

      expect(result.status).toBe(409);
    });

    it('returns CREATING_ERROR when no active free plan is seeded', async () => {
      // Pre-check passes, but the plan catalog has no active free plan.
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);
      mockDb.query.plan.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceCreate('user-1', validCreatePayload);

      expect(result.body).toMatchObject({ code: 'CREATING_ERROR' });
      // The transaction is never opened when the plan can't be resolved.
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('returns SOMETHING_WRONG on an unexpected error', async () => {
      mockDb.query.workspace.findFirst.mockRejectedValueOnce(new Error('db down'));

      const result = await workspaceCreate('user-1', validCreatePayload);

      expect(result.status).toBe(500);
    });

    it('returns CREATING_ERROR when the created workspace cannot be read back', async () => {
      // Pre-check: no existing slug. Transaction succeeds, but the re-read finds
      // nothing (findWorkspace -> undefined).
      mockDb.query.workspace.findFirst
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockDb.query.plan.findFirst.mockResolvedValueOnce(planRow());
      mockDb.transaction.mockResolvedValueOnce(WORKSPACE_ID);

      const result = await workspaceCreate('user-1', validCreatePayload);

      expect(result.body).toMatchObject({ code: 'CREATING_ERROR' });
    });
  });

  describe('workspaceGetById', () => {
    it('returns NOT_FOUND when no workspace matches', async () => {
      mockDb.query.workspace.findFirst.mockResolvedValueOnce(undefined);

      const result = await workspaceGetById(member, WORKSPACE_ID);

      expect(result.status).toBe(404);
    });
  });

  describe('workspaceDelete', () => {
    it('returns NOT_FOUND when no row is deleted', async () => {
      mockDelete([]);

      const result = await workspaceDelete(WORKSPACE_ID);

      expect(result.status).toBe(404);
    });

    it('returns SOMETHING_WRONG on an unexpected error', async () => {
      mockDb.delete.mockImplementation(() => {
        throw new Error('db down');
      });

      const result = await workspaceDelete(WORKSPACE_ID);

      expect(result.status).toBe(500);
    });
  });

  describe('workspaceUpdate', () => {
    it('returns INVALID_INPUT when the workspace id is not a uuid', async () => {
      const result = await workspaceUpdate({ ...member, workspaceId: 'not-a-uuid' }, {
        name: 'New',
      } as Parameters<typeof workspaceUpdate>[1]);

      expect(result.body).toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('returns NOT_FOUND when a valid id matches no row', async () => {
      mockUpdate([]);

      const result = await workspaceUpdate(member, { name: 'New' } as Parameters<
        typeof workspaceUpdate
      >[1]);

      expect(result.status).toBe(404);
    });

    it('maps a concurrent unique violation to SLUG_ALREADY_EXISTS', async () => {
      mockUpdate(uniqueViolation());

      const result = await workspaceUpdate(member, { name: 'New' } as Parameters<
        typeof workspaceUpdate
      >[1]);

      expect(result.status).toBe(409);
    });

    it('returns SOMETHING_WRONG on an unexpected error', async () => {
      mockUpdate(new Error('db down'));

      const result = await workspaceUpdate(member, { name: 'New' } as Parameters<
        typeof workspaceUpdate
      >[1]);

      expect(result.status).toBe(500);
    });
  });
});
