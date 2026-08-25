import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceError } from '@ordre/core/errors';
import type { WorkspaceInvitePreview } from '@ordre/core/types';

import { useInviteState } from './useInviteState';

const preview = vi.fn();
const getSession = vi.fn();

vi.mock('@/shared/services', () => ({
  services: {
    invite: {
      preview: (token: string) => preview(token),
    },
    auth: {
      getSession: () => getSession(),
    },
  },
}));

const TOKEN = 'invite-token';

const INVITE: WorkspaceInvitePreview = {
  email: 'lucas@ordre.app',
  name: 'Lucas Marino',
  role: 'member',
  workspaceName: 'Studio Marino',
  workspaceLogo: null,
  invitedByName: 'Ana Prado',
  expiresAt: '2026-09-01T12:00:00.000Z',
};

const Host = () => {
  const { state, reload } = useInviteState(TOKEN);

  return (
    <>
      <span data-testid="status">{state.status}</span>
      <span data-testid="error">{state.status === 'error' ? state.errorKey : ''}</span>
      <span data-testid="email">{'email' in state ? state.email : ''}</span>
      <button onClick={reload}>Reload</button>
    </>
  );
};

/** Lets any pending continuation run, so a state write that should not happen has its chance to. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

const setup = () => {
  const screen = render(<Host />);

  return {
    ...screen,
    reload: () => screen.getByRole('button').click(),
    status: () => screen.getByTestId('status').textContent,
    errorKey: () => screen.getByTestId('error').textContent,
    email: () => screen.getByTestId('email').textContent,
  };
};

describe('useInviteState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preview.mockResolvedValue(INVITE);
    getSession.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it('should start out loading', () => {
    const { status } = setup();

    expect(status()).toBe('loading');
  });

  it('should ask for the preview of the token it was given', async () => {
    const { status } = setup();

    await waitFor(() => expect(status()).not.toBe('loading'));
    expect(preview).toHaveBeenCalledWith(TOKEN);
  });

  it('should ask for sign-up when there is no session', async () => {
    const { status } = setup();

    await waitFor(() => expect(status()).toBe('signUp'));
  });

  it('should offer to accept when the session is the invited address', async () => {
    getSession.mockResolvedValue({ user: { email: INVITE.email } });

    const { status, email } = setup();

    await waitFor(() => expect(status()).toBe('accept'));
    expect(email()).toBe(INVITE.email);
  });

  /**
   * Better Auth lowercases the address on sign-up while the invite row keeps it
   * as it was typed, so the same person arrives with the two spelled differently.
   */
  it('should treat a differently cased address as the same one', async () => {
    getSession.mockResolvedValue({ user: { email: 'LUCAS@Ordre.app' } });

    const { status } = setup();

    await waitFor(() => expect(status()).toBe('accept'));
  });

  it('should report a mismatch when the session is a different address', async () => {
    getSession.mockResolvedValue({ user: { email: 'ana@ordre.app' } });

    const { status, email } = setup();

    await waitFor(() => expect(status()).toBe('mismatch'));
    expect(email()).toBe('ana@ordre.app');
  });

  /**
   * A failed session check costs at most a sign-up form shown to someone who did
   * not need one, and that path still ends at sign-in.
   */
  it('should treat a failed session check as signed out', async () => {
    getSession.mockRejectedValue(new ServiceError('NETWORK_ERROR', 'Offline', 500));

    const { status } = setup();

    await waitFor(() => expect(status()).toBe('signUp'));
  });

  it('should hold a failed preview as a translation key', async () => {
    preview.mockRejectedValue(new ServiceError('INVITE_NOT_FOUND', 'Not found', 404));

    const { status, errorKey } = setup();

    await waitFor(() => expect(status()).toBe('error'));
    expect(errorKey()).toBe('errors.INVITE_NOT_FOUND');
  });

  /**
   * A reload supersedes the load in flight. The two loads here resolve to
   * different screens, so a stale response landing last would be visible.
   */
  it('should drop a response that a reload has superseded', async () => {
    const SIGNED_IN = 'ana@ordre.app';

    let settleFirst: (invite: WorkspaceInvitePreview) => void = () => {};

    // The superseded load would choose `accept`, the one that replaces it `mismatch`.
    preview.mockReturnValueOnce(
      new Promise<WorkspaceInvitePreview>((resolve) => {
        settleFirst = resolve;
      })
    );
    getSession.mockResolvedValue({ user: { email: SIGNED_IN } });

    const { status, reload } = setup();

    reload();

    await waitFor(() => expect(status()).toBe('mismatch'));

    settleFirst({ ...INVITE, email: SIGNED_IN });

    await flush();

    expect(status()).toBe('mismatch');
  });

  /**
   * The session cookie is `HttpOnly`, so signing out tells the page nothing about
   * whether it worked. Asking again is the only way to find out.
   */
  it('should load again when reloaded', async () => {
    getSession.mockResolvedValue({ user: { email: 'ana@ordre.app' } });

    const { status, reload } = setup();

    await waitFor(() => expect(status()).toBe('mismatch'));

    getSession.mockResolvedValue(null);
    reload();

    await waitFor(() => expect(status()).toBe('signUp'));
    expect(preview).toHaveBeenCalledTimes(2);
  });
});
