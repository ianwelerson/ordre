import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceError } from '@ordre/core/errors';

import { useInviteAccept } from './useInviteAccept';

const replace = vi.fn();
const acceptInvite = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/shared/services', () => ({
  services: {
    invite: {
      accept: (token: string) => acceptInvite(token),
    },
  },
}));

const TOKEN = 'invite-token';

const Host = () => {
  const { accept, pending, errorKey } = useInviteAccept(TOKEN);

  return (
    <>
      <button onClick={() => void accept()}>Accept</button>
      <span data-testid="pending">{String(pending)}</span>
      <span data-testid="error">{errorKey ?? ''}</span>
    </>
  );
};

const setup = () => {
  const screen = render(<Host />);

  return {
    ...screen,
    click: () => screen.getByRole('button').click(),
    pending: () => screen.getByTestId('pending').textContent,
    errorKey: () => screen.getByTestId('error').textContent,
  };
};

describe('useInviteAccept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should accept the invite for the token it was given', async () => {
    acceptInvite.mockResolvedValue(undefined);

    const { click } = setup();

    click();

    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith(TOKEN));
  });

  it('should redirect to the dashboard once the invite is accepted', async () => {
    acceptInvite.mockResolvedValue(undefined);

    const { click } = setup();

    click();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  /**
   * The button reads `pending` to take itself out of action, so a request left
   * in flight without it would accept twice on a double click.
   */
  it('should report itself pending while the request is in flight', async () => {
    let settle = () => {};
    acceptInvite.mockReturnValue(
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
    acceptInvite.mockRejectedValue(new ServiceError('INVITE_NOT_FOUND', 'Not found', 404));

    const { click, errorKey } = setup();

    click();

    await waitFor(() => expect(errorKey()).toBe('errors.INVITE_NOT_FOUND'));
  });

  /**
   * A failure leaves the visitor on the card, so the button has to come back:
   * accepting is idempotent and retrying is the only way forward.
   */
  it('should stop being pending after a failure', async () => {
    acceptInvite.mockRejectedValue(new ServiceError('INVITE_NOT_FOUND', 'Not found', 404));

    const { click, pending, errorKey } = setup();

    click();

    await waitFor(() => expect(errorKey()).toBe('errors.INVITE_NOT_FOUND'));
    expect(pending()).toBe('false');
  });

  it('should not redirect when the invite could not be accepted', async () => {
    acceptInvite.mockRejectedValue(new ServiceError('INVITE_NOT_FOUND', 'Not found', 404));

    const { click, errorKey } = setup();

    click();

    await waitFor(() => expect(errorKey()).toBe('errors.INVITE_NOT_FOUND'));
    expect(replace).not.toHaveBeenCalled();
  });

  it('should clear a previous failure when it is retried', async () => {
    acceptInvite.mockRejectedValueOnce(new ServiceError('INVITE_NOT_FOUND', 'Not found', 404));

    const { click, errorKey } = setup();

    click();

    await waitFor(() => expect(errorKey()).toBe('errors.INVITE_NOT_FOUND'));

    acceptInvite.mockResolvedValue(undefined);
    click();

    await waitFor(() => expect(errorKey()).toBe(''));
  });
});
