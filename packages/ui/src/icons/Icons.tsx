import { DynamicIcon, type IconName as LucideIconName } from 'lucide-react/dynamic';

import { type ComponentType, lazy, Suspense, type SVGProps } from 'react';

const customIcons = {
  logo: lazy(() => import('./custom/Logo')),
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

type CustomIconName = keyof typeof customIcons;

export type IconName = CustomIconName | LucideIconName;

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number | string;
  strokeWidth?: number;
};

export default function Icon({ name, ...props }: IconProps) {
  if (name in customIcons) {
    const Custom = customIcons[name as CustomIconName];
    return (
      <Suspense fallback={null}>
        <Custom {...props} />
      </Suspense>
    );
  }

  return <DynamicIcon name={name as LucideIconName} {...props} />;
}
