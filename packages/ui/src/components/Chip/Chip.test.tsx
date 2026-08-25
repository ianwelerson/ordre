import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Chip } from './Chip';

describe('Chip.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the children', () => {
    const { getByTestId } = render(<Chip>In progress</Chip>);

    expect(getByTestId('chip')).toHaveTextContent('In progress');
  });

  it('should stay bare until a leading mark is asked for', () => {
    const { queryByTestId } = render(<Chip>In progress</Chip>);

    expect(queryByTestId('chip-dot')).not.toBeInTheDocument();
    expect(queryByTestId('chip-icon')).not.toBeInTheDocument();
  });

  it('should render the dot when asked for one', () => {
    const { getByTestId } = render(<Chip dot>In progress</Chip>);

    expect(getByTestId('chip-dot')).toBeInTheDocument();
  });

  it('should keep the dot out of the accessibility tree', () => {
    const { getByTestId } = render(<Chip dot>In progress</Chip>);

    expect(getByTestId('chip-dot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should render the icon when asked for one', async () => {
    const { findByTestId } = render(<Chip icon="check">Verified</Chip>);

    expect(await findByTestId('chip-icon')).toBeInTheDocument();
  });

  it('should pass the rest of its props to the element', () => {
    const { getByTestId } = render(<Chip title="Board status">In progress</Chip>);

    expect(getByTestId('chip')).toHaveAttribute('title', 'Board status');
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(<Chip className="custom-class">In progress</Chip>);

    expect(getByTestId('chip')).toHaveClass('custom-class');
  });
});
