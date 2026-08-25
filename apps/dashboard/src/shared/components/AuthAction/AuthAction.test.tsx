import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthAction } from './AuthAction';

describe('AuthAction.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render a button by default', () => {
    const { getByRole } = render(<AuthAction>Sign in</AuthAction>);

    expect(getByRole('button', { name: 'Sign in' })).toBeDefined();
  });

  it('should render a link when given an href', () => {
    const { getByRole } = render(
      <AuthAction href="/forgot-password">Request a new link</AuthAction>
    );

    expect(getByRole('link', { name: 'Request a new link' }).getAttribute('href')).toBe(
      '/forgot-password'
    );
  });

  /**
   * `Button` defaults to `type="button"`, so a screen that submits a form depends
   * on this prop reaching the element.
   */
  it('should pass the button type through', () => {
    const { getByRole } = render(<AuthAction type="submit">Save password</AuthAction>);

    expect(getByRole('button').getAttribute('type')).toBe('submit');
  });

  it('should call the handler it was given', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<AuthAction onClick={onClick}>Accept invite</AuthAction>);

    getByRole('button').click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should name the wait while it is busy', () => {
    const { getByRole } = render(
      <AuthAction loading loadingLabel="Joining workspace...">
        Accept invite
      </AuthAction>
    );

    expect(getByRole('button').textContent).toContain('Joining workspace...');
  });

  it('should take itself out of action while it is busy', () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <AuthAction loading onClick={onClick}>
        Accept invite
      </AuthAction>
    );

    getByRole('button').click();

    expect(onClick).not.toHaveBeenCalled();
  });
});
