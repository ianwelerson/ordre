import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Layout from './layout';

describe('Layouts.tsx', () => {
  it('should render the layout', async () => {
    const element = await Layout({
      children: <h1 data-testid="title">Test</h1>,
      params: Promise.resolve({ locale: 'en' }),
    });
    const { getByTestId } = render(element);

    expect(getByTestId('title').textContent).toBe('Test');
  });
});
