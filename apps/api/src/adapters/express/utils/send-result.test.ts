import type { Response as ExpressResponse, NextFunction, Request } from 'express';

import type { Response } from '@ordre/core/types';

import { sendAuthResult, sendMemberResult, sendResult } from './send-result.ts';

/** `res` mock exposing `status().json()` spies. */
const buildResponse = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  return { res: { status } as unknown as ExpressResponse, status, json };
};

describe('utils/sendResult', () => {
  describe('sendResult', () => {
    it('sends the controller result via res.status().json()', async () => {
      const controller = vi.fn(async (): Promise<Response<{ ok: boolean }>> => ({
        status: 201,
        body: { ok: true },
      }));
      const { res, status, json } = buildResponse();
      const next = vi.fn() as unknown as NextFunction;

      await sendResult(controller)({} as Request, res, next);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith({ ok: true });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards a thrown controller error to the error handler', async () => {
      const error = new Error('controller failed');
      const controller = vi.fn(async (): Promise<Response<unknown>> => {
        throw error;
      });
      const { res, status } = buildResponse();
      const next = vi.fn() as unknown as NextFunction;

      await sendResult(controller)({} as Request, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(status).not.toHaveBeenCalled();
    });
  });

  describe('sendAuthResult', () => {
    it('calls the controller when req.user is populated', async () => {
      const controller = vi.fn(async (): Promise<Response<{ ok: boolean }>> => ({
        status: 200,
        body: { ok: true },
      }));
      const { res, json } = buildResponse();
      const next = vi.fn() as unknown as NextFunction;

      await sendAuthResult(controller)({ user: { id: 'user-1' } } as Request, res, next);

      expect(controller).toHaveBeenCalledOnce();
      expect(json).toHaveBeenCalledWith({ ok: true });
    });

    it('forwards an error when used on an unauthenticated route', async () => {
      const controller = vi.fn();
      const { res, status } = buildResponse();
      const next = vi.fn() as unknown as NextFunction;

      await sendAuthResult(controller)({} as Request, res, next);

      expect(controller).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(status).not.toHaveBeenCalled();
    });
  });

  describe('sendMemberResult', () => {
    it('calls the controller when req.user and req.member are populated', async () => {
      const controller = vi.fn(async (): Promise<Response<{ ok: boolean }>> => ({
        status: 200,
        body: { ok: true },
      }));
      const { res, json } = buildResponse();
      const next = vi.fn() as unknown as NextFunction;

      await sendMemberResult(controller)(
        {
          user: { id: 'user-1' },
          workspace: { id: 'workspace-1' },
          member: { role: 'owner' },
        } as Request,
        res,
        next
      );

      expect(controller).toHaveBeenCalledOnce();
      expect(json).toHaveBeenCalledWith({ ok: true });
    });

    it('forwards an error when used on a non-member route', async () => {
      const controller = vi.fn();
      const { res, status } = buildResponse();
      const next = vi.fn() as unknown as NextFunction;

      // Authenticated but no `req.member`, so the member guard must reject.
      await sendMemberResult(controller)({ user: { id: 'user-1' } } as Request, res, next);

      expect(controller).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(status).not.toHaveBeenCalled();
    });
  });
});
