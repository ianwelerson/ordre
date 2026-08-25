import { runWithUser } from '#/config/db-context.ts';
import type { NextFunction, Request, Response } from 'express';

import { rlsContext } from './rls-context.ts';

// Stand in for the real thing: just run the callback so we can observe the wiring.
// The promise it hands back is the one drizzle would commit (resolve) or roll back
// (reject), which is how these tests assert transaction outcome.
vi.mock('#/config/db-context.ts', () => ({
  runWithUser: vi.fn((_userId: string, fn: () => Promise<void>) => fn()),
}));

/** `res` mock that lets us set a status and fire lifecycle events by hand. */
const buildResponse = (statusCode = 200) => {
  const handlers: Record<string, (() => void) | undefined> = {};

  return {
    res: {
      statusCode,
      on: (event: string, cb: () => void) => {
        handlers[event] = cb;
      },
    } as unknown as Response,
    fire: (event: string) => handlers[event]?.(),
  };
};

/** Returns the promise `runWithUser` was given, where resolving commits and rejecting rolls back. */
const transactionOutcome = () => vi.mocked(runWithUser).mock.results[0]?.value as Promise<void>;

describe('middleware/rlsContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens the context with the session user id and continues', () => {
    const { res, fire } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    rlsContext({ user: { id: 'user-1' } } as Request, res, next);

    expect(vi.mocked(runWithUser)).toHaveBeenCalledWith('user-1', expect.any(Function));
    expect(next).toHaveBeenCalled();

    fire('finish');
  });

  it('passes a request without a session straight through, with no context', () => {
    const { res } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    rlsContext({} as Request, res, next);

    expect(next).toHaveBeenCalled();
    expect(vi.mocked(runWithUser)).not.toHaveBeenCalled();
  });

  it('commits when the response succeeds', async () => {
    const { res, fire } = buildResponse(200);
    const next = vi.fn() as unknown as NextFunction;

    rlsContext({ user: { id: 'user-1' } } as Request, res, next);
    fire('finish');

    await expect(transactionOutcome()).resolves.toBeUndefined();
  });

  it('rolls back on a 5xx without surfacing the signal to the error handler', async () => {
    const { res, fire } = buildResponse(500);
    const next = vi.fn() as unknown as NextFunction;

    rlsContext({ user: { id: 'user-1' } } as Request, res, next);
    fire('finish');

    // Rejecting is what makes the transaction roll back.
    await expect(transactionOutcome()).rejects.toThrow();

    // The response is already sent, so the signal must not reach the error handler:
    // `next` ran once to continue the chain, and never with an error.
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards a non-rollback error to the error handler', async () => {
    const error = new Error('context failed');
    vi.mocked(runWithUser).mockRejectedValueOnce(error);
    const { res } = buildResponse();
    const next = vi.fn() as unknown as NextFunction;

    rlsContext({ user: { id: 'user-1' } } as Request, res, next);

    // The rejection is handled asynchronously in the `.catch`, so let it settle.
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });

  it('commits when the client aborts before the response finishes', async () => {
    const { res, fire } = buildResponse(200);
    const next = vi.fn() as unknown as NextFunction;

    rlsContext({ user: { id: 'user-1' } } as Request, res, next);
    fire('close');

    await expect(transactionOutcome()).resolves.toBeUndefined();
  });
});
