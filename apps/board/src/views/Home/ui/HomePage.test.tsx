import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './HomePage';

describe('HomePage.tsx', () => {
  it('should render the root component', () => {
    const { getByTestId } = render(<HomePage />);

    expect(getByTestId('home-page')).toBeInTheDocument();
  });
});
