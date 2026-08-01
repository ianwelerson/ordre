import { db } from '#/config/db.ts';
import type { NextFunction, Request, Response } from 'express';

import {
  BASE_ERRORS,
  errorResponse,
  MEMBER_ERRORS,
  VALIDATION_ERRORS,
  WORKSPACE_ERRORS,
} from '@ordre/core/errors';

import { requireWorkspaceAccess } from './workspace-access.ts';

vi.mock('#/config/db.ts', () => ({
  db: {
    query: {
      workspace: { findFirst: vi.fn() },
      workspaceMember: { findFirst: vi.fn() },
    },
  },
}));

const findWorkspace = vi.mocked(db.query.workspace.findFirst);
const findMember = vi.mocked(db.query.workspaceMember.findFirst);

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';

/** Minimal Express `Request` with the bits `requireWorkspaceAccess` reads. */
const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({ params: {}, ...overrides }) as Request;

/** `Response` mock exposing `status().json()` spies. */
const buildResponse = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  return { res: { status } as unknown as Response, status, json };
};

describe('middleware/requireWorkspaceAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responds with unauthorized when req.user is missing', async () => {
    const req = buildRequest();
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    const { status: expectedStatus, body } = errorResponse(BASE_ERRORS, 'UNAUTHORIZED');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('responds with invalid input when both id and slug params are invalid', async () => {
    const req = buildRequest({
      user: { id: 'user-1', email: 'user@example.com' },
      params: { id: '!!!', slug: '!!!' },
    });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    expect(status).toHaveBeenCalledWith(VALIDATION_ERRORS.INVALID_INPUT.status);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_INPUT',
        details: expect.objectContaining({ id: expect.any(String), slug: expect.any(String) }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('responds with invalid input when the id is invalid and no slug is provided', async () => {
    const req = buildRequest({
      user: { id: 'user-1', email: 'user@example.com' },
      params: { id: '!!!' },
    });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    expect(status).toHaveBeenCalledWith(VALIDATION_ERRORS.INVALID_INPUT.status);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_INPUT',
        details: { id: expect.any(String), slug: undefined },
      })
    );
    expect(findWorkspace).not.toHaveBeenCalled();
    expect(findMember).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('resolves the workspace by slug and returns not found when it does not exist', async () => {
    findWorkspace.mockResolvedValue(undefined);
    const req = buildRequest({
      user: { id: 'user-1', email: 'user@example.com' },
      params: { slug: 'my-workspace' },
    });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    expect(findWorkspace).toHaveBeenCalledOnce();
    const { status: expectedStatus, body } = errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_NOT_FOUND');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns not found when the caller is not a member of the workspace', async () => {
    findMember.mockResolvedValue(undefined);
    const req = buildRequest({
      user: { id: 'user-1', email: 'user@example.com' },
      params: { id: WORKSPACE_ID },
    });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    expect(findWorkspace).not.toHaveBeenCalled();
    const { status: expectedStatus, body } = errorResponse(WORKSPACE_ERRORS, 'WORKSPACE_NOT_FOUND');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns forbidden when the caller is a member but suspended', async () => {
    findMember.mockResolvedValue({ id: 'member-1', role: 'member', status: 'suspended' } as Awaited<
      ReturnType<typeof db.query.workspaceMember.findFirst>
    >);
    const req = buildRequest({
      user: { id: 'user-1', email: 'user@example.com' },
      params: { id: WORKSPACE_ID },
    });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    const { status: expectedStatus, body } = errorResponse(MEMBER_ERRORS, 'MEMBER_SELF_SUSPENDED');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(req.member).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  it('populates req.member and continues when the caller is an active member', async () => {
    findMember.mockResolvedValue({ id: 'member-1', role: 'owner', status: 'active' } as Awaited<
      ReturnType<typeof db.query.workspaceMember.findFirst>
    >);
    const req = buildRequest({
      user: { id: 'user-1', email: 'user@example.com' },
      params: { id: WORKSPACE_ID },
    });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    expect(req.member).toEqual({ id: 'member-1', workspaceId: WORKSPACE_ID, role: 'owner' });
    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
  });

  it('forwards a thrown error to the error handler', async () => {
    const error = new Error('db unavailable');
    findMember.mockRejectedValue(error);
    const req = buildRequest({
      user: { id: 'user-1', email: 'user@example.com' },
      params: { id: WORKSPACE_ID },
    });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await requireWorkspaceAccess(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(status).not.toHaveBeenCalled();
  });
});
