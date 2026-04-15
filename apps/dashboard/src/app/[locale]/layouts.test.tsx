import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Layout from './layout';

describe('Layouts.tsx', () => {
  it('should render the layout', () => {
    const { getByTestId } = render(
      <Layout>
        <h1 data-testid="title">Test</h1>
      </Layout>
    );

    expect(getByTestId('title').textContent).toBe('Test');
  });
});
