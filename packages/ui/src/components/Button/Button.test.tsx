import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('should render a leading icon alongside the text', async () => {
    const label = 'Click Here';
    const { getByTestId } = render(<Button leadingIcon="arrow-left">{label}</Button>);

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      expect(getByTestId('button-text')).toHaveTextContent(label);
    });
  });

  it('should render a trailing icon alongside the text', async () => {
    const label = 'Click Here';
    const { getByTestId } = render(<Button trailingIcon="arrow-right">{label}</Button>);

    await waitFor(() => {
      expect(getByTestId('button-trailing-icon')).toBeInTheDocument();
      expect(getByTestId('button-text')).toHaveTextContent(label);
    });
  });

  it('should render both icons at once', async () => {
    const { getByTestId } = render(
      <Button leadingIcon="arrow-left" trailingIcon="arrow-right">
        Click Here
      </Button>
    );

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      expect(getByTestId('button-trailing-icon')).toBeInTheDocument();
    });
  });

  it('should square off as an icon-only button when there is no label', async () => {
    const { getByTestId, queryByTestId } = render(
      <Button leadingIcon="arrow-left" aria-label="Go back" />
    );

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      expect(queryByTestId('button-text')).not.toBeInTheDocument();
    });
  });

  it('should render a bigger icon when the button is icon-only', async () => {
    const { getByTestId, unmount } = render(<Button leadingIcon="arrow-left">Click Here</Button>);

    await waitFor(() => {
      expect(getByTestId('button-leading-icon')).toHaveAttribute('width', '14');
    });

    unmount();

    const iconOnly = render(<Button leadingIcon="arrow-left" aria-label="Go back" />);

    await waitFor(() => {
      expect(iconOnly.getByTestId('button-leading-icon')).toHaveAttribute('width', '24');
    });
  });

  it('should render an anchor when href is provided', () => {
    const { getByTestId } = render(<Button href="https://ordre.dev">Click Here</Button>);

    const button = getByTestId('button');

    expect(button.tagName).toBe('A');
    expect(button).toHaveAttribute('href', 'https://ordre.dev');
  });

  it('should render a button element by default', () => {
    const { getByTestId } = render(<Button>Click Here</Button>);

    const button = getByTestId('button');

    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });

  describe('loading', () => {
    it('should spin the trailing icon in place rather than move the label', async () => {
      const { getByTestId, queryByTestId } = render(
        <Button trailingIcon="arrow-right" loading>
          Sign in
        </Button>
      );

      await waitFor(() => {
        expect(getByTestId('button-trailing-icon')).toBeInTheDocument();
      });
      expect(queryByTestId('button-leading-icon')).not.toBeInTheDocument();
    });

    it('should take over the leading slot when the button leads with an icon', async () => {
      const { getByTestId, queryByTestId } = render(
        <Button leadingIcon="mail" loading>
          Send
        </Button>
      );

      await waitFor(() => {
        expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      });
      expect(queryByTestId('button-trailing-icon')).not.toBeInTheDocument();
    });

    it('should grow a leading icon when the button had none', async () => {
      const { getByTestId } = render(<Button loading>Save</Button>);

      await waitFor(() => {
        expect(getByTestId('button-leading-icon')).toBeInTheDocument();
      });
    });

    it('should disable the button and mark it busy', () => {
      const { getByTestId } = render(<Button loading>Sign in</Button>);

      expect(getByTestId('button')).toBeDisabled();
      expect(getByTestId('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('should stay enabled and unbusy when not loading', () => {
      const { getByTestId } = render(<Button>Sign in</Button>);

      expect(getByTestId('button')).toBeEnabled();
      expect(getByTestId('button')).not.toHaveAttribute('aria-busy');
    });

    it('should keep an explicit disabled while not loading', () => {
      const { getByTestId } = render(<Button disabled>Sign in</Button>);

      expect(getByTestId('button')).toBeDisabled();
    });

    it('should swap the label when given a loading label', () => {
      const { getByTestId } = render(
        <Button loading loadingLabel="Signing in...">
          Sign in
        </Button>
      );

      expect(getByTestId('button-text')).toHaveTextContent('Signing in...');
    });

    it('should keep the original label when given no loading label', () => {
      const { getByTestId } = render(<Button loading>Sign in</Button>);

      expect(getByTestId('button-text')).toHaveTextContent('Sign in');
    });

    it('should not fire a click while loading', () => {
      const onClick = vi.fn();
      const { getByTestId } = render(
        <Button loading onClick={onClick}>
          Sign in
        </Button>
      );

      fireEvent.click(getByTestId('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should mark a link busy and aria-disabled, since an anchor cannot be disabled', () => {
      const { getByTestId } = render(
        <Button href="/go" loading>
          Continue
        </Button>
      );

      expect(getByTestId('button')).toHaveAttribute('aria-disabled', 'true');
      expect(getByTestId('button')).toHaveAttribute('aria-busy', 'true');
    });
  });
});
