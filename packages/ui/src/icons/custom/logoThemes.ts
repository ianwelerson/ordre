export type LogoTheme = 'white' | 'dark' | 'amber';

type LogoColors = {
  primary: string;
  accent: string;
  soft: string;
};

export const logoThemes = {
  white: {
    primary: 'var(--color-midnight)',
    accent: 'var(--color-amber)',
    soft: 'var(--color-ash)',
  },
  dark: {
    primary: 'var(--color-snow)',
    accent: 'var(--color-amber)',
    soft: 'color-mix(in srgb, var(--color-ash) 35%, transparent)',
  },
  amber: {
    primary: 'var(--color-white)',
    accent: 'var(--color-midnight)',
    soft: 'color-mix(in srgb, var(--color-white) 40%, transparent)',
  },
} as const satisfies Record<LogoTheme, LogoColors>;
