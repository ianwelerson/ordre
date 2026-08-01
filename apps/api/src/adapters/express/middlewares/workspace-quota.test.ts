import { getDb } from '#/config/db-context.ts';
import { logger } from '#/config/logger.ts';
import type { NextFunction, Request, Response } from 'express';

import { BILLING_ERRORS, errorResponse } from '@ordre/core/errors';
import type { PlanEntitlements } from '@ordre/core/types';

import { requireWorkspaceQuota } from './workspace-quota.ts';

vi.mock('#/config/db-context.ts', () => ({
  getDb: vi.fn().mockReturnValue({
    query: {
      workspaceSubscription: { findFirst: vi.fn() },
    },
    select: vi.fn(),
  }),
}));

vi.mock('#/config/logger.ts', () => ({ logger: { error: vi.fn() } }));

const findSubscription = vi.mocked(getDb().query.workspaceSubscription.findFirst);
const select = vi.mocked(getDb().select);

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const PLAN_ID = '33333333-3333-4333-8333-333333333333';

/** The member context `requireWorkspaceAccess` would have populated. */
const MEMBER = { id: MEMBER_ID, workspaceId: WORKSPACE_ID, role: 'owner' } as const;

/** Minimal Express `Request` with the bits `requireWorkspaceQuota` reads. */
const buildRequest = (overrides: Partial<Request> = {}): Request => ({ ...overrides }) as Request;

/** `Response` mock exposing `status().json()` spies. */
const buildResponse = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  return { res: { status } as unknown as Response, status, json };
};

/**
 * Resolves the subscription lookup with an active subscription whose plan
 * carries `limits`. Pass `undefined` for "no active subscription".
 *
 * Only `plan.id` and `plan.entitlements` are read, so the fixture stays at that -
 * the cast keeps the rest of the row out of the test.
 *
 * @param limits - The plan's `entitlements.limits`, or `undefined` for no subscription.
 */
const mockSubscription = (limits: PlanEntitlements['limits'] | undefined) => {
  findSubscription.mockResolvedValue(
    limits === undefined
      ? undefined
      : ({ plan: { id: PLAN_ID, entitlements: { limits } } } as unknown as Awaited<
          ReturnType<typeof findSubscription>
        >)
  );
};

/**
 * Queues one resolved `select(...).from(...).where(...)` per argument, in call
 * order: `countLocations` issues a single query, `countSeats` issues two (active
 * members, then pending invites) and sums them.
 *
 * @param totals - The `count()` result for each queued query, in call order.
 */
const mockCounts = (...totals: number[]) => {
  for (const total of totals) {
    select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([{ total }]) }),
    } as unknown as ReturnType<typeof select>);
  }
};

describe('middleware/requireWorkspaceQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should thrown error when the request has no member', async () => {
    const req = buildRequest();
    const { res } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('req.member is missing') })
    );
  });

  it('responds with the limit error when usage has reached the cap', async () => {
    mockSubscription({ location: 1 });
    mockCounts(1);
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    const { status: expectedStatus, body } = errorResponse(
      BILLING_ERRORS,
      'PLAN_LOCATION_LIMIT_REACHED'
    );
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('continues when usage is below the cap', async () => {
    mockSubscription({ location: 3 });
    mockCounts(1);
    const req = buildRequest({ member: MEMBER });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
  });

  it('responds with the limit error when the cap is already exceeded', async () => {
    // A downgrade can leave usage above the new cap, so the check has to refuse
    // beyond the exact-match case.
    mockSubscription({ location: 1 });
    mockCounts(5);
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(status).toHaveBeenCalledWith(BILLING_ERRORS.PLAN_LOCATION_LIMIT_REACHED.status);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PLAN_LOCATION_LIMIT_REACHED' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('treats a cap of zero as no room, not as unlimited', async () => {
    mockSubscription({ location: 0 });
    mockCounts(0);
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(status).toHaveBeenCalledWith(BILLING_ERRORS.PLAN_LOCATION_LIMIT_REACHED.status);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PLAN_LOCATION_LIMIT_REACHED' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('continues without counting when the plan omits the limit', async () => {
    mockSubscription({});
    const req = buildRequest({ member: MEMBER });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it('continues without counting when the limit is explicitly null', async () => {
    mockSubscription({ location: null });
    const req = buildRequest({ member: MEMBER });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it('counts a pending invite as an occupied seat', async () => {
    // One active member and one pending invite fill a two-seat plan, so the next
    // invite is refused even though the workspace has a single member.
    mockSubscription({ seat: 2 });
    mockCounts(1, 1);
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('seat')(req, res, next);

    const { status: expectedStatus, body } = errorResponse(
      BILLING_ERRORS,
      'PLAN_SEAT_LIMIT_REACHED'
    );
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
    expect(select).toHaveBeenCalledTimes(2);
  });

  it('continues when seats remain after counting members and invites', async () => {
    mockSubscription({ seat: 3 });
    mockCounts(1, 1);
    const req = buildRequest({ member: MEMBER });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('seat')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
  });

  it('responds with no active plan when the workspace has no subscription', async () => {
    mockSubscription(undefined);
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    const { status: expectedStatus, body } = errorResponse(BILLING_ERRORS, 'PLAN_MISSING');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds with no active plan when the subscription has no plan relation', async () => {
    findSubscription.mockResolvedValue({ id: 'subscription-1' } as Awaited<
      ReturnType<typeof findSubscription>
    >);
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    const { status: expectedStatus, body } = errorResponse(BILLING_ERRORS, 'PLAN_MISSING');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('fails closed when the plan entitlements do not validate', async () => {
    // A typo'd key would leave `limits.location` absent, and an absent key reads
    // as unlimited - so a malformed plan must be refused, never treated as uncapped.
    mockSubscription({ locaton: 1 } as unknown as PlanEntitlements['limits']);
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    const { status: expectedStatus, body } = errorResponse(
      BILLING_ERRORS,
      'PLAN_ENTITLEMENTS_INVALID'
    );
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      expect.objectContaining({ planId: PLAN_ID, issues: expect.any(Array) }),
      expect.any(String)
    );
  });

  it('fails closed when a limit is not a non-negative integer', async () => {
    mockSubscription({ location: -1 });
    const req = buildRequest({ member: MEMBER });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(status).toHaveBeenCalledWith(BILLING_ERRORS.PLAN_ENTITLEMENTS_INVALID.status);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PLAN_ENTITLEMENTS_INVALID' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards a thrown error to the error handler', async () => {
    const error = new Error('db unavailable');
    findSubscription.mockRejectedValue(error);
    const req = buildRequest({ member: MEMBER });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceQuota('location')(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(status).not.toHaveBeenCalled();
  });
});
