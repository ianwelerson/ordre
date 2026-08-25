import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { WorkspaceInvitePreview } from '@ordre/core/types';

import { withIntl } from '../../../../vitest/intl';
import { InviteWorkspace } from './InviteWorkspace';

const INVITE: WorkspaceInvitePreview = {
  email: 'lucas@ordre.app',
  name: 'Lucas Marino',
  role: 'member',
  workspaceName: 'Studio Marino',
  workspaceLogo: null,
  invitedByName: 'Ana Prado',
  expiresAt: '2026-09-01T12:00:00.000Z',
};

const setup = (invite: Partial<WorkspaceInvitePreview> = {}) => {
  return render(withIntl(<InviteWorkspace invite={{ ...INVITE, ...invite }} />));
};

describe('InviteWorkspace.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should name who sent the invite and the workspace it is for', () => {
    const { container } = setup();

    expect(container.textContent).toContain('Ana Prado invited you to join Studio Marino');
  });

  /**
   * The API leaves `invitedByName` empty when the inviting member is gone, so the
   * sentence has to stand without a name rather than render an empty one.
   */
  it('should still name the workspace when the inviter is unknown', () => {
    const { container } = setup({ invitedByName: null });

    expect(container.textContent).toContain('You were invited to join Studio Marino');
    expect(container.textContent).not.toContain('Ana Prado');
  });

  it('should name the role the invite grants', () => {
    const { container } = setup({ role: 'admin' });

    expect(container.textContent).toContain('Admin access');
  });

  it('should give every role its own copy', () => {
    const roles: WorkspaceInvitePreview['role'][] = ['owner', 'admin', 'member'];

    const labels = roles.map((role) => {
      const { container, unmount } = setup({ role });
      const text = container.textContent ?? '';

      unmount();

      return text;
    });

    expect(labels[0]).toContain('Owner access');
    expect(labels[1]).toContain('Admin access');
    expect(labels[2]).toContain('Member access');
  });

  it('should give the avatar the workspace name as its accessible name', () => {
    const { getByRole } = setup();

    expect(getByRole('img', { name: 'Studio Marino' })).toBeDefined();
  });
});
