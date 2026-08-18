import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Avatar } from './Avatar';

const IMAGE = 'https://example.com/ada.png';

describe('Avatar.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the first and last initial of the label', () => {
    const { getByTestId } = render(<Avatar label="Ada Lovelace" />);

    expect(getByTestId('avatar-initials')).toHaveTextContent('AL');
  });

  it('should skip the middle of a longer name, so the circle never overflows', () => {
    const { getByTestId } = render(<Avatar label="Ada Byron King Lovelace" />);

    expect(getByTestId('avatar-initials')).toHaveTextContent('AL');
  });

  /** Two letters from one word - "BI" - would read as an abbreviation of it instead. */
  it('should take one letter from a single-word label', () => {
    const { getByTestId } = render(<Avatar label="Bikeshop" />);

    expect(getByTestId('avatar-initials')).toHaveTextContent('B');
  });

  it('should uppercase the initials whatever case the label is in', () => {
    const { getByTestId } = render(<Avatar label="ada lovelace" />);

    expect(getByTestId('avatar-initials')).toHaveTextContent('AL');
  });

  it('should ignore surrounding and repeated whitespace in the label', () => {
    const { getByTestId } = render(<Avatar label="  Ada   Lovelace  " />);

    expect(getByTestId('avatar-initials')).toHaveTextContent('AL');
  });

  /** `charAt` would cut an astral character in half at its surrogate pair. */
  it('should keep a multi-byte first character whole', () => {
    const { getByTestId } = render(<Avatar label="🚲 Shop" />);

    expect(getByTestId('avatar-initials')).toHaveTextContent('🚲S');
  });

  it('should render an empty circle rather than fail on an empty label', () => {
    const { getByTestId } = render(<Avatar label="" />);

    expect(getByTestId('avatar-initials')).toHaveTextContent('');
  });

  it('should show the image instead of the initials when given one', () => {
    const { getByTestId, queryByTestId } = render(<Avatar label="Ada Lovelace" image={IMAGE} />);

    expect(getByTestId('avatar-image')).toHaveAttribute('src', IMAGE);
    expect(queryByTestId('avatar-initials')).toBeNull();
  });

  /**
   * Initials are a visual shorthand: read out on their own they say nothing, so the
   * circle carries the full label as its name.
   */
  it('should name itself after the label when it renders initials', () => {
    const { getByRole } = render(<Avatar label="Ada Lovelace" />);

    expect(getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  it('should hide the initials themselves from the accessibility tree', () => {
    const { getByTestId } = render(<Avatar label="Ada Lovelace" />);

    expect(getByTestId('avatar-initials')).toHaveAttribute('aria-hidden', 'true');
  });

  /** The `img` carries the name here, so the wrapper must not announce a second one. */
  it('should name the image after the label without doubling the img role', () => {
    const { getByRole, getByTestId } = render(<Avatar label="Ada Lovelace" image={IMAGE} />);

    expect(getByRole('img', { name: 'Ada Lovelace' })).toBe(getByTestId('avatar-image'));
    expect(getByTestId('avatar')).not.toHaveAttribute('role');
  });

  it('should forward the remaining props', () => {
    const { getByTestId } = render(<Avatar label="Ada Lovelace" id="profile-avatar" />);

    expect(getByTestId('avatar')).toHaveAttribute('id', 'profile-avatar');
  });

  it('should merge the consumer className', () => {
    const { getByTestId } = render(<Avatar label="Ada Lovelace" className="custom-class" />);

    expect(getByTestId('avatar')).toHaveClass('custom-class');
  });
});
