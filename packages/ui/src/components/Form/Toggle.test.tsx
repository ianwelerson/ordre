import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Toggle } from './Toggle';

describe('Toggle.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render a switch carrying the given name', () => {
    const { getByTestId } = render(<Toggle name="digest" label="Email notifications" />);

    const control = getByTestId('toggle-control');

    expect(control).toHaveAttribute('role', 'switch');
    expect(control).toHaveAttribute('name', 'digest');
  });

  it('should start off and flip when clicked', () => {
    const { getByTestId } = render(<Toggle name="digest" label="Email notifications" />);

    const control = getByTestId('toggle-control');

    expect(control).not.toBeChecked();

    fireEvent.click(control);

    expect(control).toBeChecked();
  });

  it('should flip when the label is clicked', () => {
    const { getByText, getByTestId } = render(<Toggle name="digest" label="Email notifications" />);

    fireEvent.click(getByText('Email notifications'));

    expect(getByTestId('toggle-control')).toBeChecked();
  });

  it('should render the description alongside the label', () => {
    const { getByText } = render(
      <Toggle name="digest" label="Email notifications" description="A daily digest of activity." />
    );

    expect(getByText('A daily digest of activity.')).toBeInTheDocument();
  });

  it('should replace the helper with the invalid message while invalid', () => {
    const { queryByText, getByText } = render(
      <Toggle
        name="digest"
        label="Email notifications"
        helper="You can change this later."
        invalid
        invalidMessage="Pick at least one channel."
      />
    );

    expect(getByText('Pick at least one channel.')).toBeInTheDocument();
    expect(queryByText('You can change this later.')).not.toBeInTheDocument();
  });

  it('should point aria-describedby at the message that is actually rendered', () => {
    const { getByTestId, getByText } = render(
      <Toggle name="digest" label="Email notifications" helper="Sent every morning." />
    );

    const describedBy = getByTestId('toggle-control').getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(getByText('Sent every morning.')).toHaveAttribute('id', describedBy);
  });

  it('should forward native input props through to the control', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <Toggle name="digest" label="Email notifications" defaultChecked onChange={onChange} />
    );

    const control = getByTestId('toggle-control');

    expect(control).toBeChecked();

    fireEvent.click(control);

    expect(onChange).toHaveBeenCalled();
  });

  it('should pass disabled down to the control', () => {
    const { getByTestId } = render(<Toggle name="digest" label="Email notifications" disabled />);

    expect(getByTestId('toggle-control')).toBeDisabled();
  });
});
