import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Typography } from './Typography';

describe('Typography.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the children', () => {
    const label = 'Hello world';
    const { getByTestId } = render(<Typography tag="p">{label}</Typography>);

    expect(getByTestId('typography')).toBeInTheDocument();
    expect(getByTestId('typography')).toHaveTextContent(label);
  });

  it('should render with the given tag', () => {
    const { getByTestId } = render(<Typography tag="h1">Heading</Typography>);

    expect(getByTestId('typography').tagName).toBe('H1');
  });

  it('should apply the uppercase class when uppercase is true', () => {
    const { getByTestId } = render(
      <Typography tag="span" uppercase>
        Text
      </Typography>
    );

    expect(getByTestId('typography')).toHaveClass('uppercase');
  });

  it('should apply the italic class when italic is true', () => {
    const { getByTestId } = render(
      <Typography tag="p" italic>
        Text
      </Typography>
    );

    expect(getByTestId('typography')).toHaveClass('italic');
  });

  it('should apply the underline class when underline is true', () => {
    const { getByTestId } = render(
      <Typography tag="p" underline>
        Text
      </Typography>
    );

    expect(getByTestId('typography')).toHaveClass('underline');
  });

  it('should apply the line-through class when strikethrough is true', () => {
    const { getByTestId } = render(
      <Typography tag="p" strikethrough>
        Text
      </Typography>
    );

    expect(getByTestId('typography')).toHaveClass('line-through');
  });

  it('should stack decorations rather than let the last one win', () => {
    const { getByTestId } = render(
      <Typography tag="span" italic underline>
        Text
      </Typography>
    );

    expect(getByTestId('typography')).toHaveClass('italic', 'underline');
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(
      <Typography tag="p" className="custom-class">
        Text
      </Typography>
    );

    expect(getByTestId('typography')).toHaveClass('custom-class');
  });
});
