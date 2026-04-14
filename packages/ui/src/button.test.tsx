import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button.tsx', () => {
  it('should render the button', () => {
    const { getByTestId } = render(<Button appName="test">Test</Button>);

    expect(getByTestId('button')).toBeInTheDocument();
  });
});
