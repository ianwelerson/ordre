import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the children', () => {
    const { getByTestId } = render(<Badge>Quick</Badge>);

    expect(getByTestId('badge')).toHaveTextContent('Quick');
  });

  // The variant shouts in CSS, so nothing should uppercase the text in JS on the way.
  it('should keep the text it was given rather than the case it displays', () => {
    const { getByTestId } = render(<Badge>Quick</Badge>);

    expect(getByTestId('badge').textContent).toBe('Quick');
  });

  it('should pass the rest of its props to the element', () => {
    const { getByTestId } = render(<Badge title="Board type">Quick</Badge>);

    expect(getByTestId('badge')).toHaveAttribute('title', 'Board type');
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(<Badge className="custom-class">Quick</Badge>);

    expect(getByTestId('badge')).toHaveClass('custom-class');
  });
});
