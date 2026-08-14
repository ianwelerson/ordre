import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RadioGroup, type RadioOption } from './RadioGroup';

const OPTIONS: RadioOption[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'never', label: 'Never' },
];

describe('RadioGroup.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render one radio per option, all sharing the group name', () => {
    const { getAllByTestId } = render(<RadioGroup name="cadence" options={OPTIONS} />);

    const controls = getAllByTestId('radio-group-option');

    expect(controls).toHaveLength(OPTIONS.length);
    controls.forEach((control) => {
      expect(control).toHaveAttribute('type', 'radio');
      expect(control).toHaveAttribute('name', 'cadence');
    });
  });

  it('should render the group label', () => {
    const { getByText } = render(
      <RadioGroup name="cadence" label="How often?" options={OPTIONS} />
    );

    expect(getByText('How often?')).toBeInTheDocument();
  });

  it('should expose the group to assistive tech, named by its label', () => {
    const { getByRole } = render(
      <RadioGroup name="cadence" label="How often?" options={OPTIONS} />
    );

    expect(getByRole('radiogroup', { name: 'How often?' })).toBeInTheDocument();
  });

  it('should leave the group unnamed rather than dangling when there is no label', () => {
    const { getByTestId } = render(<RadioGroup name="cadence" options={OPTIONS} />);

    expect(getByTestId('radio-group')).not.toHaveAttribute('aria-labelledby');
  });

  it('should start on the default value', () => {
    const { getAllByTestId } = render(
      <RadioGroup name="cadence" options={OPTIONS} defaultValue="monthly" />
    );

    const [weekly, monthly] = getAllByTestId('radio-group-option');

    expect(monthly).toBeChecked();
    expect(weekly).not.toBeChecked();
  });

  it('should report the chosen value when an option is picked', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <RadioGroup name="cadence" options={OPTIONS} onChange={onChange} />
    );

    fireEvent.click(getByText('Never'));

    expect(onChange).toHaveBeenCalledWith('never');
  });

  it('should let only one option be chosen at a time', () => {
    const { getAllByTestId } = render(<RadioGroup name="cadence" options={OPTIONS} />);

    const [weekly, monthly] = getAllByTestId('radio-group-option');

    fireEvent.click(weekly as HTMLElement);
    expect(weekly).toBeChecked();

    fireEvent.click(monthly as HTMLElement);
    expect(monthly).toBeChecked();
    expect(weekly).not.toBeChecked();
  });

  it('should follow the controlled value', () => {
    const { getAllByTestId, rerender } = render(
      <RadioGroup name="cadence" options={OPTIONS} value="weekly" onChange={vi.fn()} />
    );

    const [weekly, monthly] = getAllByTestId('radio-group-option');

    expect(weekly).toBeChecked();

    rerender(<RadioGroup name="cadence" options={OPTIONS} value="monthly" onChange={vi.fn()} />);

    expect(monthly).toBeChecked();
    expect(weekly).not.toBeChecked();
  });

  it('should replace the helper with the invalid message while invalid', () => {
    const { queryByText, getByText } = render(
      <RadioGroup
        name="cadence"
        options={OPTIONS}
        helper="You can change this later."
        invalid
        invalidMessage="Pick a cadence."
      />
    );

    expect(getByText('Pick a cadence.')).toBeInTheDocument();
    expect(queryByText('You can change this later.')).not.toBeInTheDocument();
  });

  it('should describe the group rather than any single option', () => {
    const { getByTestId, getByText } = render(
      <RadioGroup name="cadence" options={OPTIONS} helper="Visits repeat on this rhythm." />
    );

    const describedBy = getByTestId('radio-group').getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(getByText('Visits repeat on this rhythm.')).toHaveAttribute('id', describedBy);
  });

  it('should disable a single option without disabling the group', () => {
    const { getAllByTestId } = render(
      <RadioGroup
        name="cadence"
        options={[...OPTIONS.slice(0, 2), { value: 'never', label: 'Never', disabled: true }]}
      />
    );

    const [weekly, , never] = getAllByTestId('radio-group-option');

    expect(never).toBeDisabled();
    expect(weekly).toBeEnabled();
  });

  it('should disable every option when the group is disabled', () => {
    const { getAllByTestId } = render(<RadioGroup name="cadence" options={OPTIONS} disabled />);

    getAllByTestId('radio-group-option').forEach((control) => {
      expect(control).toBeDisabled();
    });
  });
});
