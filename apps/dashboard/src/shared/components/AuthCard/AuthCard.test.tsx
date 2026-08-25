import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthCard } from './AuthCard';

describe('AuthCard.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render its children', () => {
    const { getByTestId } = render(
      <AuthCard>
        <p data-testid="content">Welcome back.</p>
      </AuthCard>
    );

    expect(getByTestId('content').textContent).toBe('Welcome back.');
  });

  /**
   * The card's gap is what spaces a screen's blocks, so each has to stay a direct
   * child. A wrapper in between would collapse three gaps into one.
   */
  it('should keep every block a direct child', () => {
    const { getByTestId } = render(
      <AuthCard>
        <p data-testid="heading">Welcome back.</p>
        <form data-testid="form" />
        <p data-testid="footnote">New here?</p>
      </AuthCard>
    );

    const card = getByTestId('heading').parentElement;

    expect(card?.children.length).toBe(3);
    expect(card).toBe(getByTestId('footnote').parentElement);
  });
});
