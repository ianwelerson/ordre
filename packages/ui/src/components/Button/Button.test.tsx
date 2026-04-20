import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the button', () => {
    const label = 'Click Here';
    const { getByTestId } = render(<Button>{label}</Button>);

    expect(getByTestId('button')).toBeInTheDocument();
    expect(getByTestId('button-text')).toHaveTextContent(label);
  });

  it('should render the button icon the text', async () => {
    const label = 'Click Here';
    const { getByTestId } = render(<Button icon="arrow-left">{label}</Button>);

    await waitFor(() => {
      expect(getByTestId('button-icon')).toBeInTheDocument();
      expect(getByTestId('button-text')).toHaveTextContent(label);
    });
  });

  it('should render icon only button', async () => {
    const label = 'Click Here';

    const { getByTestId, queryByTestId } = render(
      <Button icon="arrow-left" iconOnly={true}>
        {label}
      </Button>
    );

    await waitFor(() => {
      expect(getByTestId('button-icon')).toBeInTheDocument();
      expect(queryByTestId('button-text')).not.toBeInTheDocument();
    });
  });

  it('should not render the children value when it is empty', async () => {
    const { getByTestId, queryByTestId } = render(<Button icon="arrow-left" />);

    await waitFor(() => {
      expect(getByTestId('button-icon')).toBeInTheDocument();
      expect(queryByTestId('button-text')).not.toBeInTheDocument();
    });
  });
});
