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

  it('should render the Ordre Logo icon', async () => {
    const { getByTestId } = render(<Icons name="ordre-logo" data-testid="logo" />);

    await waitFor(() => {
      expect(getByTestId('logo')).toBeInTheDocument();
    });
  });

  it('should render the Ordre Lockup icon', async () => {
    const { getByTestId } = render(<Icons name="ordre-lockup" data-testid="lockup" />);

    await waitFor(() => {
      expect(getByTestId('lockup')).toBeInTheDocument();
    });
  });
});
