import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Welcome } from './welcome';

describe('Welcome.tsx', () => {
  it('should render the root component', () => {
    const { getByTestId } = render(<Welcome />);

    expect(getByTestId('welcome-page')).toBeInTheDocument();
  });
});
