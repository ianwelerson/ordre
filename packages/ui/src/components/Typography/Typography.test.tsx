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

  it('should apply classes for the default variant', () => {
    const { getByTestId } = render(<Typography tag="p">Default</Typography>);

    const el = getByTestId('typography');
    expect(el).toHaveClass('font-body', 'font-normal', 'text-base', 'leading-body');
  });

  it('should apply classes for the selected variant', () => {
    const { getByTestId } = render(
      <Typography tag="h1" variant="display">
        Hero
      </Typography>
    );

    const el = getByTestId('typography');
    expect(el).toHaveClass(
      'font-headline',
      'font-bold',
      'text-4xl',
      'leading-display-lg',
      'tracking-display-lg'
    );
  });

  it('should apply classes for the heading variants', () => {
    const { getByTestId } = render(
      <Typography tag="h1" variant="h1">
        Boards on the record
      </Typography>
    );

    const el = getByTestId('typography');
    expect(el).toHaveClass(
      'font-headline',
      'font-semibold',
      'text-3xl',
      'leading-display',
      'tracking-display'
    );
  });

  it('should render mono labels uppercase with label tracking', () => {
    const { getByTestId } = render(
      <Typography tag="span" variant="mono-label">
        Label
      </Typography>
    );

    const el = getByTestId('typography');
    expect(el).toHaveClass(
      'font-mono',
      'font-medium',
      'text-2xs',
      'tracking-label',
      'uppercase',
      'text-foreground-subtle'
    );
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

  it('should combine decoration props with the variant', () => {
    const { getByTestId } = render(
      <Typography tag="span" variant="subtitle" italic underline>
        Text
      </Typography>
    );

    const el = getByTestId('typography');
    expect(el).toHaveClass('font-body', 'font-medium', 'text-lg', 'italic', 'underline');
  });

  it('should render captions at the small step', () => {
    const { getByTestId } = render(
      <Typography tag="span" variant="caption">
        Helper text
      </Typography>
    );

    expect(getByTestId('typography')).toHaveClass('text-xs', 'text-foreground-subtle');
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
