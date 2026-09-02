export type LogoTheme = 'white' | 'dark' | 'amber' | 'mono';

type LogoColors = {
  primary: string;
  accent: string;
};

/**
 * Ink colours for the Ordre mark, one entry per background it sits on.
 *
 * `primary` strokes the O, `accent` fills the cursor bar. `mono` defers both to the
 * inherited `color`, so a caller can print the mark in a single ink of its own.
 */
export const logoThemes = {
  white: {
    primary: 'var(--color-midnight)',
    accent: 'var(--color-amber)',
  },
  dark: {
    primary: 'var(--color-snow)',
    accent: 'var(--color-amber)',
  },
  amber: {
    primary: 'var(--color-white)',
    accent: 'var(--color-white)',
  },
  mono: {
    primary: 'currentColor',
    accent: 'currentColor',
  },
} as const satisfies Record<LogoTheme, LogoColors>;
