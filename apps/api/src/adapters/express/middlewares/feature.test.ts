import { isFeatureEnabled } from '#/services/feature.ts';
import type { NextFunction, Request, Response } from 'express';

import { errorMessage } from '@ordre/core/errors';

import { requireFeature } from './feature.ts';

vi.mock('#/services/feature.ts', () => ({ isFeatureEnabled: vi.fn() }));

const checkFeature = vi.mocked(isFeatureEnabled);

/** Minimal Express `Request`; `requireFeature` reads nothing off it. */
const buildRequest = (): Request => ({}) as Request;

/** `Response` mock exposing `status().json()` spies. */
const buildResponse = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });

  return { res: { status } as unknown as Response, status, json };
};

describe('requireFeature', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('continues to the next handler while the switch is on', async () => {
    checkFeature.mockResolvedValue(true);

    const { res, status } = buildResponse();
    const next = vi.fn() as NextFunction;

    await requireFeature('workspace-creation')(buildRequest(), res, next);

    expect(next).toHaveBeenCalledWith();
    expect(status).not.toHaveBeenCalled();
  });

  it('refuses with the code for that feature while the switch is off', async () => {
    checkFeature.mockResolvedValue(false);

    const { res, status, json } = buildResponse();
    const next = vi.fn() as NextFunction;

    await requireFeature('workspace-location')(buildRequest(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      code: 'FEATURE_WORKSPACE_LOCATION_DISABLED',
      message: errorMessage('FEATURE_WORKSPACE_LOCATION_DISABLED'),
    });
  });

  it('refuses each feature with the code that names it', async () => {
    checkFeature.mockResolvedValue(false);

    const { res, json } = buildResponse();

    await requireFeature('workspace-invite')(buildRequest(), res, vi.fn() as NextFunction);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FEATURE_WORKSPACE_INVITE_DISABLED' })
    );
  });

  it('forwards a thrown error to the error handler without answering', async () => {
    const error = new Error('switch lookup exploded');

    checkFeature.mockRejectedValue(error);

    const { res, status } = buildResponse();
    const next = vi.fn() as NextFunction;

    await requireFeature('registration')(buildRequest(), res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(status).not.toHaveBeenCalled();
  });
});
