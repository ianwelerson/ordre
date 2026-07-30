import { auth } from '#/config/auth.ts';
import type { NextFunction, Request, Response } from 'express';

import { AUTH_ERRORS, errorResponse } from '@ordre/core/errors';

import { authenticate } from './authenticate.ts';

vi.mock('#/config/auth.ts', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const getSession = vi.mocked(auth.api.getSession);

/** Minimal Express `Request` with the bits `authenticate` reads. */
const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({ headers: {}, ...overrides }) as Request;

/** `Response` mock exposing `status().json()` spies. */
const buildResponse = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  return { res: { status } as unknown as Response, status, json };
};

describe('middleware/authenticate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responds with unauthorized when there's no session", async () => {
    getSession.mockResolvedValue(null);
    const req = buildRequest();
    const { res, status, json } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    const { status: expectedStatus, body } = errorResponse(AUTH_ERRORS, 'UNAUTHORIZED');
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(body);
    expect(next).not.toHaveBeenCalled();
  });

  it('populates req.user and continues on a valid session', async () => {
    getSession.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    const req = buildRequest();
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(req.user).toEqual({ id: 'user-1', email: 'user@example.com' });
    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
  });

  it('forwards a thrown error to the error handler', async () => {
    const error = new Error('session lookup failed');
    getSession.mockRejectedValue(error);
    const req = buildRequest();
    const { res, status } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(status).not.toHaveBeenCalled();
  });
});
