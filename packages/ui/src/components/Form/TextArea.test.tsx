import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TextArea } from './TextArea';

describe('TextArea.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render a textarea carrying the given name', () => {
    const { getByTestId } = render(<TextArea name="note" />);

    expect(getByTestId('text-area-control').tagName).toBe('TEXTAREA');
    expect(getByTestId('text-area-control')).toHaveAttribute('name', 'note');
  });

  it('should associate the label with the control so clicking it focuses the textarea', () => {
    const { getByText, getByTestId } = render(<TextArea name="note" label="Internal note" />);

    fireEvent.click(getByText('Internal note'));

    expect(getByTestId('text-area-control')).toHaveFocus();
  });

  it('should replace the helper with the invalid message while invalid', () => {
    const { queryByText, getByText } = render(
      <TextArea name="note" helper="Team only." invalid invalidMessage="Say a bit more." />
    );

    expect(getByText('Say a bit more.')).toBeInTheDocument();
    expect(queryByText('Team only.')).not.toBeInTheDocument();
  });

  it('should mark the control invalid for assistive tech', () => {
    const { getByTestId } = render(<TextArea name="note" invalid />);

    expect(getByTestId('text-area-control')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should point aria-describedby at the message that is actually rendered', () => {
    const { getByTestId, getByText } = render(<TextArea name="note" helper="Team only." />);

    const describedBy = getByTestId('text-area-control').getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(getByText('Team only.')).toHaveAttribute('id', describedBy);
  });

  it('should forward native textarea props through to the control', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <TextArea name="note" rows={8} onChange={onChange} placeholder="Notes..." />
    );

    const control = getByTestId('text-area-control');

    expect(control).toHaveAttribute('rows', '8');
    expect(control).toHaveAttribute('placeholder', 'Notes...');

    fireEvent.change(control, { target: { value: 'Sourcing from Bienne.' } });

    expect(onChange).toHaveBeenCalled();
  });
});
