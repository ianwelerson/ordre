import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the children', () => {
    const { getByTestId } = render(<Card tag="div">Body copy</Card>);

    expect(getByTestId('card')).toHaveTextContent('Body copy');
  });

  it('should render the tag it is given', () => {
    const { getByTestId, unmount } = render(<Card tag="div">Body copy</Card>);

    expect(getByTestId('card').tagName).toBe('DIV');

    unmount();

    const section = render(<Card tag="section">Body copy</Card>);

    expect(section.getByTestId('card').tagName).toBe('SECTION');
  });

  it('should stay flat until it is marked interactive', () => {
    const { getByTestId } = render(<Card tag="div">Body copy</Card>);

    expect(getByTestId('card').className).not.toMatch(/hover:/);
  });

  /**
   * The lift is the affordance, so it has to survive a refactor of the class string:
   * a shadow with no translate reads as a different card, not a lifting one.
   */
  it('should lift on hover when interactive', () => {
    const { getByTestId } = render(
      <Card tag="div" interactive>
        Body copy
      </Card>
    );

    expect(getByTestId('card')).toHaveClass(
      'hover:shadow-raised',
      'hover:translate-y-[-2px]',
      'hover:cursor-pointer',
      'transition-all'
    );
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(
      <Card tag="div" className="custom-class">
        Body copy
      </Card>
    );

    expect(getByTestId('card')).toHaveClass('custom-class');
  });
});
