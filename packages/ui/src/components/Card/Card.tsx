import { cva, type VariantProps } from 'class-variance-authority';

import type { ReactNode } from 'react';

const variants = cva(['border border-solid rounded-lg'], {
  variants: {
    variant: {
      /** White on Snow. The workhorse surface. */
      standard: 'bg-background-elevated border-border',
      /** Snow on White. The nested container - use it inside a standard card. */
      quiet: 'bg-background border-border',
      /** Midnight. Reserved for next-visit, plan card and hero anatomy. */
      ink: 'bg-foreground border-foreground',
    },
    padding: {
      none: '',
      standard: 'py-5 px-6',
    },
    /**
     * Cards rest at one elevation, so the lift is the whole hover affordance.
     *
     * The 2px is arbitrary on purpose: the spacing scale is a layout scale and has no
     * step that small, and `translate-[-2px]` would move both axes, not just this one.
     */
    interactive: {
      true: 'transition-all duration-base ease-standard hover:cursor-pointer hover:shadow-raised hover:translate-y-[-2px]',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'standard',
    padding: 'standard',
    interactive: false,
  },
});

export interface CardProps extends VariantProps<typeof variants> {
  children: ReactNode;
  tag: 'div' | 'section';
  className?: string;
}

/**
 * The surface primitive. `variant` picks the tone and `tag` picks the element, so a
 * card that happens to be a landmark does not have to look different to say so.
 *
 * The `ink` tone inverts its contents, which the type scale cannot follow: every
 * `Typography` variant bakes in a foreground colour. Set the colours on the children
 * directly there, the way the Ink story does.
 */
export const Card = ({
  tag: Tag,
  variant,
  interactive,
  padding,
  children,
  className,
}: CardProps) => {
  return (
    <Tag data-testid="card" className={variants({ variant, interactive, padding, className })}>
      {children}
    </Tag>
  );
};
