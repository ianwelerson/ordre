import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthHeading } from './AuthHeading';

describe('AuthHeading.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  /** One `h1` per screen, and this is it - the card holds nothing else that ranks. */
  it('should render the headline as the page heading', () => {
    const { getByRole } = render(<AuthHeading eyebrow="Sign in" title="Welcome back." />);

    expect(getByRole('heading', { level: 1 }).textContent).toBe('Welcome back.');
  });

  it('should render the eyebrow', () => {
    const { getByText } = render(<AuthHeading eyebrow="Sign in" title="Welcome back." />);

    expect(getByText('Sign in')).toBeDefined();
  });

  /** A screen with nothing more to say stops at the headline. */
  it('should omit the subtitle when none is given', () => {
    const { queryByText } = render(<AuthHeading eyebrow="Sign in" title="Welcome back." />);

    expect(queryByText('Pick up where you left off.')).toBeNull();
  });

  it('should render the subtitle when given', () => {
    const { getByText } = render(
      <AuthHeading eyebrow="Sign in" title="Welcome back." subtitle="Pick up where you left off." />
    );

    expect(getByText('Pick up where you left off.')).toBeDefined();
  });

  /**
   * `media` belongs to the eyebrow, so it has to land between the two rather than
   * after the headline: the invite screens read as eyebrow, workspace, title.
   */
  it('should place media between the eyebrow and the headline', () => {
    const { container } = render(
      <AuthHeading
        eyebrow="Join workspace"
        media={<span>Bike Shop</span>}
        title="Set up your account."
      />
    );

    const order = Array.from(container.querySelectorAll('span, h1')).map(
      (node) => node.textContent
    );

    expect(order.indexOf('Bike Shop')).toBeGreaterThan(order.indexOf('Join workspace'));
    expect(order.indexOf('Set up your account.')).toBeGreaterThan(order.indexOf('Bike Shop'));
  });

  /**
   * Without media the three parts stay in one block and read as a unit; with it
   * the headline becomes a block of its own so the card's gap separates them.
   */
  it('should split into two blocks only when it has media', () => {
    const plain = render(<AuthHeading eyebrow="Sign in" title="Welcome back." />);

    expect(plain.container.children.length).toBe(1);

    cleanup();

    const withMedia = render(
      <AuthHeading eyebrow="Join workspace" media={<span>Bike Shop</span>} title="Set up." />
    );

    expect(withMedia.container.children.length).toBe(2);
  });
});
