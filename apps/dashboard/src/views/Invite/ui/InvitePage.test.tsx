import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceError } from '@ordre/core/errors';
import type { WorkspaceInvitePreview } from '@ordre/core/types';

import { withIntl } from '../../../../vitest/intl';
import InvitePage from './InvitePage';

const TOKEN = 'invite-token';

const preview = vi.fn();
const getSession = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ token: TOKEN }),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/shared/services', () => ({
  services: {
    invite: {
      preview: (token: string) => preview(token),
      accept: vi.fn(),
    },
    auth: {
      getSession: () => getSession(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

const INVITE: WorkspaceInvitePreview = {
  email: 'lucas@ordre.app',
  name: 'Lucas Marino',
  role: 'member',
  workspaceName: 'Studio Marino',
  workspaceLogo: null,
  invitedByName: 'Ana Prado',
  expiresAt: '2026-09-01T12:00:00.000Z',
};

const setup = () => render(withIntl(<InvitePage />));

describe('InvitePage.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preview.mockResolvedValue(INVITE);
    getSession.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it('should look the invite up by the token in the route', async () => {
    setup();

    await waitFor(() => expect(preview).toHaveBeenCalledWith(TOKEN));
  });

  /**
   * Only the first skeleton is labelled, so the wait is announced once rather
   * than by every block in the card.
   */
  it('should announce the wait while the invite loads', () => {
    const { getAllByRole } = setup();

    expect(getAllByRole('status', { name: 'Loading invite' })).toHaveLength(1);
  });

  it('should show the sign-up card when there is no session', async () => {
    const { findByText } = setup();

    expect(await findByText('Set up your account.')).toBeDefined();
  });

  it('should show the accept card when signed in as the invited address', async () => {
    getSession.mockResolvedValue({ user: { email: INVITE.email } });

    const { findByText } = setup();

    expect(await findByText('Accept your invite.')).toBeDefined();
  });

  it('should show the mismatch card when signed in as another address', async () => {
    getSession.mockResolvedValue({ user: { email: 'ana@ordre.app' } });

    const { findByText } = setup();

    expect(await findByText('This invite is for someone else.')).toBeDefined();
  });

  it('should show the error card when the invite could not be loaded', async () => {
    preview.mockRejectedValue(new ServiceError('INVITE_NOT_FOUND', 'Not found', 404));

    const { findByText } = setup();

    expect(await findByText("This invite can't be opened.")).toBeDefined();
  });

  /**
   * The error card resolves the state's key against the catalog, so a code the
   * app has copy for reads as a sentence rather than as `errors.INVITE_NOT_FOUND`.
   */
  it('should render the failure as a sentence, not a key', async () => {
    preview.mockRejectedValue(new ServiceError('INVITE_NOT_FOUND', 'Not found', 404));

    const { findByText, container } = setup();

    await findByText("This invite can't be opened.");

    expect(container.textContent).not.toContain('errors.INVITE_NOT_FOUND');
  });

  it('should show only one card at a time', async () => {
    const { findByText, queryByText } = setup();

    await findByText('Set up your account.');

    expect(queryByText('Accept your invite.')).toBeNull();
    expect(queryByText('This invite is for someone else.')).toBeNull();
  });
});
