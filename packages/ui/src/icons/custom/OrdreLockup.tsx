import type { SVGProps } from 'react';

import { type LogoTheme, logoThemes } from './logoThemes';

type OrdreLockupProps = SVGProps<SVGSVGElement> & {
  theme?: LogoTheme;
};

/**
 * Renders the Ordre mark with the wordmark set beside it.
 *
 * The type size, tracking and weight are fixed numbers rather than typography
 * tokens: the viewBox is cut to the measured width of "Ordre" at these values, and
 * a token that moved would push the word past the right edge and clip it.
 *
 * @param theme - Picks the ink pair for the background the lockup sits on.
 */
export default function OrdreLockup({ theme = 'white', ...props }: OrdreLockupProps) {
  const colors = logoThemes[theme];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="13 4 206.9 56"
      width="100%"
      fill="none"
      {...props}
    >
      <rect x="16" y="7" width="32" height="40" rx="12" stroke={colors.primary} strokeWidth="6" />
      <rect x="15" y="54" width="34" height="6" rx="3" fill={colors.accent} />
      <text
        x="85"
        y="50.25"
        fontFamily="var(--font-headline)"
        fontWeight="700"
        fontSize="49"
        letterSpacing="-0.03em"
        fill={colors.primary}
      >
        Ordre
      </text>
    </svg>
  );
}
