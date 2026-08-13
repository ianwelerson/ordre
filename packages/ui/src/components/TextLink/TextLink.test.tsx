import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TextLink } from './TextLink';

describe('TextLink.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render an anchor with the label', () => {
    const { getByTestId } = render(<TextLink href="/pricing">Pricing</TextLink>);

    const link = getByTestId('text-link');

    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/pricing');
    expect(link).toHaveTextContent('Pricing');
  });

  it('should mark the active link', () => {
    const { getByTestId } = render(
      <TextLink href="/pricing" active>
        Pricing
      </TextLink>
    );

    expect(getByTestId('text-link')).toHaveAttribute('aria-current', 'page');
  });

  it('should not set aria-current when inactive', () => {
    const { getByTestId } = render(<TextLink href="/pricing">Pricing</TextLink>);

    expect(getByTestId('text-link')).not.toHaveAttribute('aria-current');
  });

  it('should render a trailing icon', async () => {
    const { getByTestId } = render(
      <TextLink href="/pricing" variant="menu" trailingIcon="arrow-right">
        Pricing
      </TextLink>
    );

    await waitFor(() => {
      expect(getByTestId('text-link-trailing-icon')).toBeInTheDocument();
    });
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(
      <TextLink href="/pricing" className="custom-class">
        Pricing
      </TextLink>
    );

    expect(getByTestId('text-link')).toHaveClass('custom-class');
  });
});
