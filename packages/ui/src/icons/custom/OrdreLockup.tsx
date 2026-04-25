import type { SVGProps } from 'react';

import { type LogoTheme, logoThemes } from './logoThemes';

type OrdreLockupProps = SVGProps<SVGSVGElement> & {
  theme?: LogoTheme;
};

export default function OrdreLockup({ theme = 'white', ...props }: OrdreLockupProps) {
  const colors = logoThemes[theme];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 6 118 26"
      width="100%"
      fill="none"
      {...props}
    >
      <rect x="0" y="6" width="26" height="3.5" rx="1.75" fill={colors.primary} />
      <rect x="0" y="15" width="18" height="3.5" rx="1.75" fill={colors.primary} />
      <circle cx="24" cy="16.75" r="4.5" fill={colors.accent} />
      <rect x="0" y="24" width="10" height="3.5" rx="1.75" fill={colors.soft} />
      <text
        x="38"
        y="31"
        fontFamily="var(--font-headline)"
        fontWeight="var(--font-weight-bold)"
        fontSize="var(--text-2xl)"
        letterSpacing="var(--tracking-display-lg)"
        fill={colors.primary}
      >
        Ordre
      </text>
    </svg>
  );
}
