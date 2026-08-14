import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox';

describe('Checkbox.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render a checkbox carrying the given name', () => {
    const { getByTestId } = render(<Checkbox name="terms" label="I agree" />);

    const control = getByTestId('checkbox-control');

    expect(control).toHaveAttribute('type', 'checkbox');
    expect(control).toHaveAttribute('name', 'terms');
  });

  it('should start unchecked and toggle when clicked', () => {
    const { getByTestId } = render(<Checkbox name="terms" label="I agree" />);

    const control = getByTestId('checkbox-control');

    expect(control).not.toBeChecked();

    fireEvent.click(control);

    expect(control).toBeChecked();
  });

  it('should toggle when the label is clicked', () => {
    const { getByText, getByTestId } = render(<Checkbox name="terms" label="I agree" />);

    fireEvent.click(getByText('I agree'));

    expect(getByTestId('checkbox-control')).toBeChecked();
  });

  it('should render the description alongside the label', () => {
    const { getByText } = render(
      <Checkbox name="terms" label="I agree" description="You can withdraw this later." />
    );

    expect(getByText('You can withdraw this later.')).toBeInTheDocument();
  });

  it('should replace the helper with the invalid message while invalid', () => {
    const { queryByText, getByText } = render(
      <Checkbox
        name="terms"
        label="I agree"
        helper="We only email about your boards."
        invalid
        invalidMessage="You have to accept the terms."
      />
    );

    expect(getByText('You have to accept the terms.')).toBeInTheDocument();
    expect(queryByText('We only email about your boards.')).not.toBeInTheDocument();
  });

  it('should mark the control invalid for assistive tech', () => {
    const { getByTestId, rerender } = render(<Checkbox name="terms" label="I agree" />);

    expect(getByTestId('checkbox-control')).not.toHaveAttribute('aria-invalid');

    rerender(<Checkbox name="terms" label="I agree" invalid />);

    expect(getByTestId('checkbox-control')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should point aria-describedby at the message that is actually rendered', () => {
    const { getByTestId, getByText } = render(
      <Checkbox name="terms" label="I agree" helper="Required to continue." />
    );

    const describedBy = getByTestId('checkbox-control').getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(getByText('Required to continue.')).toHaveAttribute('id', describedBy);
  });

  it('should not describe the control when there is no message', () => {
    const { getByTestId } = render(<Checkbox name="terms" label="I agree" />);

    expect(getByTestId('checkbox-control')).not.toHaveAttribute('aria-describedby');
  });

  it('should forward native input props through to the control', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <Checkbox name="terms" label="I agree" defaultChecked onChange={onChange} value="yes" />
    );

    const control = getByTestId('checkbox-control');

    expect(control).toBeChecked();
    expect(control).toHaveAttribute('value', 'yes');

    fireEvent.click(control);

    expect(onChange).toHaveBeenCalled();
  });

  it('should pass disabled down to the control', () => {
    const { getByTestId } = render(<Checkbox name="terms" label="I agree" disabled />);

    expect(getByTestId('checkbox-control')).toBeDisabled();
  });

  it('should give two checkboxes of the same name distinct ids', () => {
    const { getAllByTestId } = render(
      <>
        <Checkbox name="terms" label="I agree" />
        <Checkbox name="terms" label="I agree" />
      </>
    );

    const ids = getAllByTestId('checkbox-control').map((control) => control.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
