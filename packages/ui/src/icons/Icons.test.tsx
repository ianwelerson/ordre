import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Icons from './Icons';

describe('Icons.tsx', () => {
  it('should render a lucide icon', async () => {
    const { getByTestId } = render(<Icons name="arrow-down" data-testid="icon" />);

    await waitFor(() => {
      expect(getByTestId('icon')).toBeInTheDocument();
    });
  });

  it('should render the Logo icon', async () => {
    const { getByTestId } = render(<Icons name="logo" data-testid="logo" />);

    await waitFor(() => {
      expect(getByTestId('icon')).toBeInTheDocument();
    });
  });
});
