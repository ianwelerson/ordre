import type { SVGProps } from 'react';

import { type LogoTheme, logoThemes } from './logoThemes';

type OrdreLogoProps = SVGProps<SVGSVGElement> & {
  theme?: LogoTheme;
};

/**
 * Renders the Ordre mark: an outlined O sitting on a cursor bar.
 *
 * The art is centred in a square 64-unit box with padding on both axes, so it can
 * drop straight into a square slot without a wrapper.
 *
 * @param theme - Picks the ink pair for the background the mark sits on.
 */
export default function OrdreLogo({ theme = 'white', ...props }: OrdreLogoProps) {
  const colors = logoThemes[theme];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" fill="none" {...props}>
      <rect x="16" y="7" width="32" height="40" rx="12" stroke={colors.primary} strokeWidth="6" />
      <rect x="15" y="54" width="34" height="6" rx="3" fill={colors.accent} />
    </svg>
  );
}
