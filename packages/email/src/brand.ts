/**
 * The design tokens the email templates render with.
 *
 * Restated here as plain values rather than imported from `@ordre/ui`: email
 * clients strip stylesheets and custom properties, so every rule has to be
 * inlined at render time, and the UI package's tokens only exist as CSS.
 *
 * Mirrors both tiers of `packages/ui/src/styles/tokens/colors.css`. Templates
 * should read {@link brand.token}, the semantic tier, so a decision like
 * "subtle text is too light" is made once here rather than at each usage.
 *
 * The font stacks are web-safe rather than the brand faces. A webfont is not
 * reliably available in an email client, so the monospace stack stands in for
 * the brand's technical voice on labels and data.
 *
 * @see apps/docs/content/docs/product/brand/foundations.mdx
 */
export const brand = {
  /** The base palette, matching the `--color-*` base tier by name. */
  color: {
    midnight: '#1A1D26',
    slate: '#3A3F4B',
    snow: '#FAFAF8',
    warmGray: '#F0EEEB',
    ash: '#D9D6D0',
    stone: '#8A8680',
    white: '#FFFFFF',
    amber: '#E0913E',
    deepAmber: '#C67A2E',
    amberWash: '#FEF9EF',
    sage: '#5B9A6F',
    brick: '#C44B3F',
  },
  /** The semantic tier. Prefer these in templates; the palette above backs them. */
  token: {
    foreground: '#1A1D26',
    foregroundMuted: '#3A3F4B',
    foregroundSubtle: '#8A8680',
    background: '#FAFAF8',
    backgroundAlt: '#F0EEEB',
    backgroundElevated: '#FFFFFF',
    backgroundAccent: '#FEF9EF',
    border: '#D9D6D0',
    accent: '#E0913E',
    accentStrong: '#C67A2E',
    success: '#5B9A6F',
    invalid: '#C44B3F',
  },
  font: {
    body: 'Helvetica, Arial, sans-serif',
    mono: '"Courier New", Courier, monospace',
  },
  /** The `--text-*` steps the templates use, named as the scale names them. */
  text: {
    '3xs': '10px',
    '2xs': '11px',
    xs: '13px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    '2xl': '28px',
  },
  /** The `--leading-*` steps. */
  leading: {
    headline: 1.2,
    caption: 1.5,
    body: 1.6,
  },
  /** The `--tracking-*` ladder. */
  tracking: {
    display: '-0.02em',
    headline: '-0.018em',
    button: '-0.005em',
    meta: '0.08em',
    label: '0.12em',
    eyebrow: '0.14em',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  size: {
    /** Outer email width. The mobile rule in `EmailShell` collapses it to 100%. */
    container: 600,
  },
} as const;
