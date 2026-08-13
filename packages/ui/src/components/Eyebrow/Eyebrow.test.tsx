import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Eyebrow } from './Eyebrow';

describe('Eyebrow.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the label', () => {
    const { getByTestId } = render(<Eyebrow>Sign in</Eyebrow>);

    expect(getByTestId('eyebrow-label')).toHaveTextContent('Sign in');
  });

  it('should stay a single label when there is no qualifier', () => {
    const { getByTestId, queryByTestId } = render(<Eyebrow>Sign in</Eyebrow>);

    expect(queryByTestId('eyebrow-leading')).not.toBeInTheDocument();
    expect(getByTestId('eyebrow').textContent).toBe('Sign in');
  });

  it('should print the qualifier ahead of the label', () => {
    const { getByTestId } = render(<Eyebrow leading="Step 1">Sign in</Eyebrow>);

    expect(getByTestId('eyebrow-leading')).toHaveTextContent('Step 1');
    expect(getByTestId('eyebrow').textContent).toBe('Step 1·Sign in');
  });

  /**
   * The middot is punctuation drawn between the two halves, not a word: reading it out
   * would break the phrase in two.
   */
  it('should keep the separator out of the accessibility tree', () => {
    const { getByTestId } = render(<Eyebrow leading="Step 1">Sign in</Eyebrow>);

    const separator = getByTestId('eyebrow').querySelector('[aria-hidden="true"]');

    expect(separator).toHaveTextContent('·');
  });

  /**
   * `mono-label` uppercases the label, so the DOM keeps the casing the caller passed
   * and a screen reader is never handed shouted text.
   */
  it('should leave the casing to the type scale', () => {
    const { getByTestId } = render(<Eyebrow>Sign in</Eyebrow>);

    expect(getByTestId('eyebrow-label').textContent).toBe('Sign in');
  });

  it('should forward the remaining props', () => {
    const { getByTestId } = render(<Eyebrow id="sign-in-eyebrow">Sign in</Eyebrow>);

    expect(getByTestId('eyebrow')).toHaveAttribute('id', 'sign-in-eyebrow');
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(<Eyebrow className="custom-class">Sign in</Eyebrow>);

    expect(getByTestId('eyebrow')).toHaveClass('custom-class');
  });
});
