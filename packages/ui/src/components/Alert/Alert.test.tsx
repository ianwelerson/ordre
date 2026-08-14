import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Alert } from './Alert';

describe('Alert.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the message', () => {
    const { getByText } = render(<Alert>That email and password do not match.</Alert>);

    expect(getByText('That email and password do not match.')).toBeInTheDocument();
  });

  it('should render a title above the message when given one', () => {
    const { getByText } = render(
      <Alert title="Check your inbox">We sent you a sign-in link.</Alert>
    );

    expect(getByText('Check your inbox')).toBeInTheDocument();
    expect(getByText('We sent you a sign-in link.')).toBeInTheDocument();
  });

  it('should interrupt for a failure, since the reader has just been stopped', () => {
    const { getByTestId } = render(<Alert>Something went wrong.</Alert>);

    expect(getByTestId('alert')).toHaveAttribute('role', 'alert');
  });

  it('should only report for success and info', () => {
    const { getByTestId, rerender } = render(<Alert tone="success">Saved.</Alert>);

    expect(getByTestId('alert')).toHaveAttribute('role', 'status');

    rerender(<Alert tone="info">Heads up.</Alert>);

    expect(getByTestId('alert')).toHaveAttribute('role', 'status');
  });

  it('should carry an icon for the tone', async () => {
    const { findByTestId } = render(<Alert>Something went wrong.</Alert>);

    expect(await findByTestId('alert-icon')).toBeInTheDocument();
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(<Alert className="custom-class">Message</Alert>);

    expect(getByTestId('alert')).toHaveClass('custom-class');
  });
});
