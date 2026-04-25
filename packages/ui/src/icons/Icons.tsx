import { DynamicIcon, type IconName as LucideIconName } from 'lucide-react/dynamic';

import { type ComponentType, lazy, Suspense, type SVGProps } from 'react';

import type { LogoTheme } from './custom/logoThemes';

type CustomIconProps = SVGProps<SVGSVGElement> & {
  theme?: LogoTheme;
};

const customIcons = {
  'ordre-logo': lazy(() => import('./custom/OrdreLogo')),
  'ordre-lockup': lazy(() => import('./custom/OrdreLockup')),
} satisfies Record<string, ComponentType<CustomIconProps>>;

type CustomIconName = keyof typeof customIcons;

export type IconName = CustomIconName | LucideIconName;

type CommonIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number;
};

type IconProps = CommonIconProps &
  ({ name: CustomIconName; theme?: LogoTheme } | { name: LucideIconName; theme?: never });

export default function Icon({ name, theme, ...props }: IconProps) {
  if (name in customIcons) {
    const Custom = customIcons[name as CustomIconName];
    return (
      <Suspense fallback={null}>
        <Custom {...props} theme={theme} />
      </Suspense>
    );
  }

  return <DynamicIcon name={name as LucideIconName} {...props} />;
}
