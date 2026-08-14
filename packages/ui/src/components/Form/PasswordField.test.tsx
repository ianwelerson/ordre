import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PasswordField } from './PasswordField';

describe('PasswordField.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should start masked', () => {
    const { getByTestId } = render(<PasswordField name="password" />);

    expect(getByTestId('text-field-control')).toHaveAttribute('type', 'password');
  });

  it('should reveal the value when the toggle is pressed, and mask it again', () => {
    const { getByTestId } = render(<PasswordField name="password" />);

    const toggle = getByTestId('password-field-toggle');

    fireEvent.click(toggle);
    expect(getByTestId('text-field-control')).toHaveAttribute('type', 'text');

    fireEvent.click(toggle);
    expect(getByTestId('text-field-control')).toHaveAttribute('type', 'password');
  });

  it('should label the toggle for the action it offers', () => {
    const { getByTestId } = render(<PasswordField name="password" />);

    const toggle = getByTestId('password-field-toggle');

    expect(toggle).toHaveTextContent('Show');

    fireEvent.click(toggle);

    expect(toggle).toHaveTextContent('Hide');
  });

  it('should report the reveal state for assistive tech', () => {
    const { getByTestId } = render(<PasswordField name="password" />);

    const toggle = getByTestId('password-field-toggle');

    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('should not submit the form it sits in', () => {
    const { getByTestId } = render(<PasswordField name="password" />);

    expect(getByTestId('password-field-toggle')).toHaveAttribute('type', 'button');
  });

  it('should carry the field anatomy through', () => {
    const { getByText, getByTestId } = render(
      <PasswordField name="password" label="Password" invalid invalidMessage="Too short." />
    );

    fireEvent.click(getByText('Password'));

    expect(getByTestId('text-field-control')).toHaveFocus();
    expect(getByTestId('text-field-control')).toHaveAttribute('aria-invalid', 'true');
    expect(getByText('Too short.')).toBeInTheDocument();
  });
});
