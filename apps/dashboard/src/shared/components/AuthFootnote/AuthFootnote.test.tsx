import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthFootnote } from './AuthFootnote';

describe('AuthFootnote.tsx', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render its children', () => {
    const { getByText } = render(<AuthFootnote>New here?</AuthFootnote>);

    expect(getByText('New here?')).toBeDefined();
  });

  /** Prose, not a label: the line is read as a sentence, so it is a paragraph. */
  it('should render the note as a paragraph', () => {
    const { getByText } = render(<AuthFootnote>New here?</AuthFootnote>);

    expect(getByText('New here?').tagName).toBe('P');
  });

  it('should keep a link inside the sentence reachable', () => {
    const { getByRole } = render(
      <AuthFootnote>
        New here? <a href="/get-started">Create one</a>
      </AuthFootnote>
    );

    expect(getByRole('link', { name: 'Create one' }).getAttribute('href')).toBe('/get-started');
  });
});
