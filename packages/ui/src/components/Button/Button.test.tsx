import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the button', () => {
    const label = 'Click Here';
    const { getByTestId } = render(<Button>{label}</Button>);

    expect(getByTestId('button')).toBeInTheDocument();
    expect(getByTestId('button-text')).toHaveTextContent(label);
  });

  it('should render a leading icon alongside the text', async () => {
    const label = 'Click Here';
    const { getByTestId } = render(<Button leadingIcon="arrow-left">{label}</Button>);

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      expect(getByTestId('button-text')).toHaveTextContent(label);
    });
  });

  it('should render a trailing icon alongside the text', async () => {
    const label = 'Click Here';
    const { getByTestId } = render(<Button trailingIcon="arrow-right">{label}</Button>);

    await waitFor(() => {
      expect(getByTestId('button-trailing-icon')).toBeInTheDocument();
      expect(getByTestId('button-text')).toHaveTextContent(label);
    });
  });

  it('should render both icons at once', async () => {
    const { getByTestId } = render(
      <Button leadingIcon="arrow-left" trailingIcon="arrow-right">
        Click Here
      </Button>
    );

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      expect(getByTestId('button-trailing-icon')).toBeInTheDocument();
    });
  });

  it('should square off as an icon-only button when there is no label', async () => {
    const { getByTestId, queryByTestId } = render(
      <Button leadingIcon="arrow-left" aria-label="Go back" />
    );

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      expect(queryByTestId('button-text')).not.toBeInTheDocument();
      expect(getByTestId('button')).toHaveClass('size-11');
      expect(getByTestId('button').className).not.toMatch(/(^|\s)px-/);
    });
  });

  it('should render a bigger icon when the button is icon-only', async () => {
    const { getByTestId, unmount } = render(<Button leadingIcon="arrow-left">Click Here</Button>);

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toHaveAttribute('width', '14');
    });

    unmount();

    const iconOnly = render(<Button leadingIcon="arrow-left" aria-label="Go back" />);

    await waitFor(() => {
      expect(iconOnly.getByTestId('button-leading-icon')).toHaveAttribute('width', '24');
    });
  });

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
    ['xl', 'h-13'],
  ] as const)('should apply the %s size', (size, heightClass) => {
    const { getByTestId } = render(<Button size={size}>Click Here</Button>);

    expect(getByTestId('button')).toHaveClass(heightClass);
  });

  it.each([
    ['primary', 'bg-button'],
    ['secondary', 'border-border'],
    ['ghost', 'bg-transparent'],
    ['ink', 'bg-foreground'],
    ['destructive', 'bg-invalid'],
  ] as const)('should apply the %s variant', (variant, expectedClass) => {
    const { getByTestId } = render(<Button variant={variant}>Click Here</Button>);

    expect(getByTestId('button')).toHaveClass(expectedClass);
  });

  it('should render a pill', () => {
    const { getByTestId } = render(<Button shape="pill">Click Here</Button>);

    expect(getByTestId('button')).toHaveClass('rounded-full');
  });

  it('should render an anchor when href is provided', () => {
    const { getByTestId } = render(<Button href="https://ordre.dev">Click Here</Button>);

    const button = getByTestId('button');

    expect(button.tagName).toBe('A');
    expect(button).toHaveAttribute('href', 'https://ordre.dev');
  });

  it('should render a button element by default', () => {
    const { getByTestId } = render(<Button>Click Here</Button>);

    const button = getByTestId('button');

    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });
});
