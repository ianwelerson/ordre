'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { type IconName as LucideIconName } from 'lucide-react/dynamic';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import Icon from '../../icons/Icons';

const variants = cva(
  /**
   * No font-family here on purpose: the variants set it, and two family
   * utilities on one element resolve by stylesheet order, not class order.
   */
  ['no-underline transition-colors duration-fast ease-standard hover:cursor-pointer'],
  {
    variants: {
      variant: {
        /** Inline text link. The desktop header nav and any prose link. */
        nav: 'font-body inline-flex items-center gap-2 text-sm',
        /** Full-width headline row. The sliding menu on small screens. */
        menu: [
          'font-headline border-warm-gray flex min-h-13 items-center justify-between gap-4',
          'border-b border-solid px-6 text-lg font-semibold tracking-title',
          'active:bg-background-alt',
        ],
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'nav', active: false, class: 'text-foreground-muted hover:text-foreground' },
      { variant: 'nav', active: true, class: 'text-foreground font-medium' },
      { variant: 'menu', active: false, class: 'text-foreground' },
      { variant: 'menu', active: true, class: 'text-button-hover' },
    ],
    defaultVariants: {
      variant: 'nav',
      active: false,
    },
  }
);

export type TextLinkProps = VariantProps<typeof variants> &
  Omit<ComponentPropsWithRef<'a'>, 'className'> & {
    children?: ReactNode;
    /** Icon placed after the label. The menu variant pushes it to the far edge. */
    trailingIcon?: LucideIconName;
    className?: string;
  };

const ICON_SIZE: Record<NonNullable<VariantProps<typeof variants>['variant']>, number> = {
  nav: 14,
  menu: 16,
};

/**
 * A navigational link with no button chrome. `active` marks the current page both
 * visually and through `aria-current`, so the two can never drift apart.
 */
export const TextLink = ({
  children,
  variant,
  active,
  trailingIcon,
  className,
  ...rest
}: TextLinkProps) => (
  <a
    data-testid="text-link"
    aria-current={active ? 'page' : undefined}
    {...rest}
    className={variants({ variant, active, className })}
  >
    {children}
    {trailingIcon && (
      <Icon
        name={trailingIcon}
        data-testid="text-link-trailing-icon"
        size={ICON_SIZE[variant ?? 'nav']}
        className="text-foreground-subtle shrink-0"
      />
    )}
  </a>
);
