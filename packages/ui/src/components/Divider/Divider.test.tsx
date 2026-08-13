import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Divider } from './Divider';

describe('Divider.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render a horizontal separator by default', () => {
    const { getByTestId } = render(<Divider />);

    const divider = getByTestId('divider');

    expect(divider).toHaveAttribute('role', 'separator');
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('should stay empty when there is no label', () => {
    const { getByTestId } = render(<Divider />);

    expect(getByTestId('divider')).toBeEmptyDOMElement();
  });

  it('should render the label', () => {
    const { getByTestId } = render(<Divider>Or</Divider>);

    expect(getByTestId('divider')).toHaveTextContent('Or');
  });

  it('should turn on its side when vertical', () => {
    const { getByTestId } = render(<Divider orientation="vertical" />);

    expect(getByTestId('divider')).toHaveAttribute('aria-orientation', 'vertical');
  });

  /**
   * A non-focusable `separator` has presentational children, so the visible label
   * would never reach a screen reader on its own.
   */
  it('should name itself after a plain-text label', () => {
    const { getByRole } = render(<Divider>Or</Divider>);

    expect(getByRole('separator', { name: 'Or' })).toBeInTheDocument();
  });

  it('should leave a rich label unnamed for the caller to name', () => {
    const { getByTestId } = render(
      <Divider>
        <em>Or</em>
      </Divider>
    );

    expect(getByTestId('divider')).not.toHaveAttribute('aria-label');
  });

  it('should let the caller name it', () => {
    const { getByRole } = render(<Divider aria-label="Alternative sign-in">Or</Divider>);

    expect(getByRole('separator', { name: 'Alternative sign-in' })).toBeInTheDocument();
  });

  it('should forward the remaining props', () => {
    const { getByTestId } = render(<Divider id="sign-in-divider" />);

    expect(getByTestId('divider')).toHaveAttribute('id', 'sign-in-divider');
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(<Divider className="custom-class" />);

    expect(getByTestId('divider')).toHaveClass('custom-class');
  });
});
