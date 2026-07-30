import type { Response as ExpressResponse, NextFunction, Request } from 'express';

import type { Response } from '@ordre/core/types';

import { isAuthenticated } from './is-authenticated.ts';
import { isWorkspaceMember } from './is-workspace-member.ts';

/**
 * Wraps a controller into an Express handler.
 *
 * Runs the controller, sends its `{ status, body }` result via
 * `res.status().json()`, and forwards any thrown error to the central error
 * handler through `next`. This keeps the response-writing logic in one place so
 * route handlers don't repeat it, and lets controllers stay adapter-agnostic -
 * the `req -> arguments` mapping happens in the callback, not the controller.
 *
 * @param controller - Receives the Express `req` and returns a `Response`.
 * @returns An Express request handler.
 */
export const sendResult = <T>(controller: (req: Request) => Promise<Response<T>>) => {
  return async (req: Request, res: ExpressResponse, next: NextFunction) => {
    try {
      const result = await controller(req);

      // 204 No Content carries no body: the status code alone signals success
      // (see `NoContentResponse`). Writing JSON here would violate the contract,
      // so end the response without a body.
      if (result.status === 204) {
        res.status(204).end();
        return;
      }

      res.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Wraps a controller for an authenticated route, narrowing `req` to
 * `AuthenticatedRequest` so the controller can read `req.user` without a null check.
 *
 * Builds on `sendResult`: the `authenticate` middleware already guarantees `req.user`
 * is populated before the handler runs, so the `isAuthenticated` guard only narrows
 * the type (and throws if the wrapper is ever mounted on a route that skipped it).
 *
 * @param controller - Receives an `AuthenticatedRequest` and returns a `Response`.
 * @returns An Express request handler.
 */
export const sendAuthResult = <T>(
  controller: (req: AuthenticatedRequest) => Promise<Response<T>>
) =>
  sendResult((req) => {
    if (!isAuthenticated(req)) {
      throw new Error('sendAuthResult used on an unauthenticated route');
    }

    return controller(req);
  });

/**
 * Wraps a controller for a workspace member route, narrowing `req` to
 * `WorkspaceMemberRequest` so the controller can read `req.user` and `req.member`
 * without a null check.
 *
 * Builds on `sendAuthResult`: the `requireWorkspaceAccess` middleware already
 * guarantees `req.member` is populated before the handler runs, so the
 * `isWorkspaceMember` guard only narrows the type (and throws if the wrapper is ever
 * mounted on a route that skipped it).
 *
 * @param controller - Receives a `WorkspaceMemberRequest` and returns a `Response`.
 * @returns An Express request handler.
 */
export const sendMemberResult = <T>(
  controller: (req: WorkspaceMemberRequest) => Promise<Response<T>>
) =>
  sendAuthResult((req) => {
    if (!isWorkspaceMember(req)) {
      throw new Error('sendMemberResult used on an non-member route');
    }

    return controller(req);
  });
