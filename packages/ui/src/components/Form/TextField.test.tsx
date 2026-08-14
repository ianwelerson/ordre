import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TextField } from './TextField';

describe('TextField.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render an input carrying the given name', () => {
    const { getByTestId } = render(<TextField name="email" />);

    expect(getByTestId('text-field-control')).toHaveAttribute('name', 'email');
  });

  it('should default to a text input and let the caller override the type', () => {
    const { getByTestId, rerender } = render(<TextField name="email" />);

    expect(getByTestId('text-field-control')).toHaveAttribute('type', 'text');

    rerender(<TextField name="email" type="email" />);

    expect(getByTestId('text-field-control')).toHaveAttribute('type', 'email');
  });

  it('should associate the label with the input so clicking it focuses the control', () => {
    const { getByText, getByTestId } = render(<TextField name="email" label="Email" />);

    fireEvent.click(getByText('Email'));

    expect(getByTestId('text-field-control')).toHaveFocus();
  });

  it('should render the helper text', () => {
    const { getByText } = render(<TextField name="email" helper="We never share it." />);

    expect(getByText('We never share it.')).toBeInTheDocument();
  });

  it('should replace the helper with the invalid message while invalid', () => {
    const { queryByText, getByText } = render(
      <TextField name="email" helper="We never share it." invalid invalidMessage="Not an email." />
    );

    expect(getByText('Not an email.')).toBeInTheDocument();
    expect(queryByText('We never share it.')).not.toBeInTheDocument();
  });

  it('should keep the helper when invalid but no invalid message was given', () => {
    const { getByText } = render(<TextField name="email" helper="We never share it." invalid />);

    expect(getByText('We never share it.')).toBeInTheDocument();
  });

  it('should mark the input invalid for assistive tech', () => {
    const { getByTestId, rerender } = render(<TextField name="email" />);

    expect(getByTestId('text-field-control')).not.toHaveAttribute('aria-invalid');

    rerender(<TextField name="email" invalid />);

    expect(getByTestId('text-field-control')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should point aria-describedby at the message that is actually rendered', () => {
    const { getByTestId, getByText } = render(
      <TextField name="email" invalid invalidMessage="Not an email." />
    );

    const describedBy = getByTestId('text-field-control').getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(getByText('Not an email.')).toHaveAttribute('id', describedBy);
  });

  it('should not describe the input when there is no message', () => {
    const { getByTestId } = render(<TextField name="email" />);

    expect(getByTestId('text-field-control')).not.toHaveAttribute('aria-describedby');
  });

  it('should render the optional tag only when asked', () => {
    const { queryByTestId, rerender } = render(<TextField name="phone" label="Phone" />);

    expect(queryByTestId('field-optional')).not.toBeInTheDocument();

    rerender(<TextField name="phone" label="Phone" optional />);

    expect(queryByTestId('field-optional')).toBeInTheDocument();
  });

  it('should render a prefix and a suffix inside the field box', () => {
    const { getByTestId } = render(
      <TextField name="amount" prefix={<span>CHF</span>} suffix={<span>.app</span>} />
    );

    const shell = getByTestId('field-shell');

    expect(shell).toHaveTextContent('CHF');
    expect(shell).toHaveTextContent('.app');
  });

  it('should forward native input props through to the control', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <TextField name="email" onChange={onChange} placeholder="mia@example.com" required />
    );

    const input = getByTestId('text-field-control');

    expect(input).toHaveAttribute('placeholder', 'mia@example.com');
    expect(input).toBeRequired();

    fireEvent.change(input, { target: { value: 'mia@example.ch' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('should use the caller id when one is given', () => {
    const { getByTestId } = render(<TextField name="email" id="sign-in-email" />);

    expect(getByTestId('text-field-control')).toHaveAttribute('id', 'sign-in-email');
  });

  it('should give two fields of the same name distinct ids', () => {
    const { getAllByTestId } = render(
      <>
        <TextField name="email" label="Email" />
        <TextField name="email" label="Email" />
      </>
    );

    const ids = getAllByTestId('text-field-control').map((input) => input.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
