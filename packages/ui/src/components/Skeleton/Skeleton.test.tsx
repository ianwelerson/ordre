import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

describe('Skeleton.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render', () => {
    const { getByTestId } = render(<Skeleton className="h-4 w-40" />);

    expect(getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should stay out of the accessibility tree until it is given a label', () => {
    const { getByTestId } = render(<Skeleton className="h-4 w-40" />);

    expect(getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
    expect(getByTestId('skeleton')).not.toHaveAttribute('role');
  });

  it('should announce the wait when it is labelled', () => {
    const { getByRole } = render(<Skeleton label="Loading invite" className="h-4 w-40" />);

    expect(getByRole('status')).toHaveAccessibleName('Loading invite');
  });

  it('should drop the hidden attribute once it is labelled', () => {
    const { getByTestId } = render(<Skeleton label="Loading invite" className="h-4 w-40" />);

    expect(getByTestId('skeleton')).not.toHaveAttribute('aria-hidden');
  });

  it('should pass the rest of its props to the element', () => {
    const { getByTestId } = render(<Skeleton id="invite-placeholder" className="h-4 w-40" />);

    expect(getByTestId('skeleton')).toHaveAttribute('id', 'invite-placeholder');
  });

  // Sizing is the whole className API here: dropping it renders a zero-height box.
  it('should merge the consumer className', () => {
    const { getByTestId } = render(<Skeleton className="h-4 w-40" />);

    expect(getByTestId('skeleton')).toHaveClass('h-4', 'w-40');
  });
});
