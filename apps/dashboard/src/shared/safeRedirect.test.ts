import { describe, expect, it } from 'vitest';

import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
  it('keeps a same-origin path, with its query string', () => {
    expect(safeRedirect('/settings')).toBe('/settings');
    expect(safeRedirect('/settings?tab=billing&q=a%20b')).toBe('/settings?tab=billing&q=a%20b');
  });

  it.each([
    ['//evil.com', 'protocol-relative'],
    ['/\\evil.com', 'backslash protocol-relative'],
    ['/\\/evil.com', 'mixed slash and backslash'],
  ])('refuses %j (%s)', (next) => {
    expect(safeRedirect(next)).toBe('/');
  });

  it.each(['https://evil.com/path', 'javascript:alert(1)', 'settings', '../settings', ''])(
    'refuses anything not rooted at this origin (%j)',
    (next) => {
      expect(safeRedirect(next)).toBe('/');
    }
  );

  it('falls back when the parameter is absent', () => {
    expect(safeRedirect(null)).toBe('/');
  });

  it('drops a fragment', () => {
    expect(safeRedirect('/settings?tab=billing#section')).toBe('/settings?tab=billing');
  });

  it('normalises traversal rather than letting it escape', () => {
    expect(safeRedirect('/a/../../etc/passwd')).toBe('/etc/passwd');
  });
});
