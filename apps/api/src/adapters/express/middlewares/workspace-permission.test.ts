import type { NextFunction, Request, Response } from 'express';

import { BASE_ERRORS, errorResponse } from '@ordre/core/errors';

import { requireWorkspacePermission } from './workspace-permission.ts';

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';

/** Minimal Express `Request` with the bits `requireWorkspacePermission` reads. */
const buildRequest = (overrides: Partial<Request> = {}): Request => ({ ...overrides }) as Request;

/** `Response` mock exposing `status().json()` spies. */
const buildResponse = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  return { res: { status } as unknown as Response, status, json };
};

describe('middleware/requireWorkspacePermission', () => {
  it('continues when the role holds the required permission', () => {
    const req = buildRequest({
      member: { id: 'member-1', workspaceId: WORKSPACE_ID, role: 'owner' },
    });
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireWorkspacePermission('workspace:delete')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
  });

  it('responds with forbidden when the role lacks the required permission', () => {
    const req = buildRequest({
      member: { id: 'member-1', workspaceId: WORKSPACE_ID, role: 'member' },
    });
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireWorkspacePermission('workspace:delete')(req, res, next);

    const { status: expectedStatus, body } = errorResponse(BASE_ERRORS, 'FORBIDDEN');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards an error to the handler when req.member is missing (misconfigured mount)', () => {
    const req = buildRequest();
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireWorkspacePermission('workspace:read')(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(status).not.toHaveBeenCalled();
  });
});
