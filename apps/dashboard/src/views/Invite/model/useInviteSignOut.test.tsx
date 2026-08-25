import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceError } from '@ordre/core/errors';

import { useInviteSignOut } from './useInviteSignOut';

const signOutRequest = vi.fn();

vi.mock('@/shared/services', () => ({
  services: {
    auth: {
      signOut: () => signOutRequest(),
    },
  },
}));

const Host = ({ onSignedOut }: { onSignedOut: () => void }) => {
  const { signOut, pending, errorKey } = useInviteSignOut(onSignedOut);

  return (
    <>
      <button onClick={() => void signOut()}>Sign out</button>
      <span data-testid="pending">{String(pending)}</span>
      <span data-testid="error">{errorKey ?? ''}</span>
    </>
  );
};

const setup = () => {
  const onSignedOut = vi.fn();
  const screen = render(<Host onSignedOut={onSignedOut} />);

  return {
    ...screen,
    onSignedOut,
    click: () => screen.getByRole('button').click(),
    pending: () => screen.getByTestId('pending').textContent,
    errorKey: () => screen.getByTestId('error').textContent,
  };
};

describe('useInviteSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * The page stays put and reloads instead of navigating, because the mismatch
   * card is where the invitee still needs to be once the session is gone.
   */
  it('should tell the caller once the session is gone', async () => {
    signOutRequest.mockResolvedValue(undefined);

    const { click, onSignedOut } = setup();

    click();

    await waitFor(() => expect(onSignedOut).toHaveBeenCalledOnce());
  });

  it('should report itself pending while the request is in flight', async () => {
    let settle = () => {};
    signOutRequest.mockReturnValue(
      new Promise<void>((resolve) => {
        settle = resolve;
      })
    );

    const { click, pending } = setup();

    click();

    await waitFor(() => expect(pending()).toBe('true'));

    settle();
  });

  it('should hold the failure as a translation key', async () => {
    signOutRequest.mockRejectedValue(new ServiceError('NETWORK_ERROR', 'Offline', 500));

    const { click, errorKey } = setup();

    click();

    await waitFor(() => expect(errorKey()).toBe('errors.NETWORK_ERROR'));
  });

  it('should not reload the page when signing out failed', async () => {
    signOutRequest.mockRejectedValue(new ServiceError('NETWORK_ERROR', 'Offline', 500));

    const { click, errorKey, onSignedOut } = setup();

    click();

    await waitFor(() => expect(errorKey()).toBe('errors.NETWORK_ERROR'));
    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it('should stop being pending after a failure', async () => {
    signOutRequest.mockRejectedValue(new ServiceError('NETWORK_ERROR', 'Offline', 500));

    const { click, errorKey, pending } = setup();

    click();

    await waitFor(() => expect(errorKey()).toBe('errors.NETWORK_ERROR'));
    expect(pending()).toBe('false');
  });
});
