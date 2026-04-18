import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Layout from './layout';

vi.mock('next-intl/server', () => ({
  getLocale: () => Promise.resolve('en'),
  getTranslations: () => Promise.resolve('en'),
}));

describe('Layouts.tsx', () => {
  it('should render the layout', async () => {
    const element = await Layout({
      children: <h1 data-testid="title">Test</h1>,
    });
    const { getByTestId } = render(element);

    expect(getByTestId('title').textContent).toBe('Test');
  });
});
