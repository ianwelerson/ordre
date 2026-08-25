import { cva, type VariantProps } from 'class-variance-authority';

import type { ComponentPropsWithRef, ReactNode } from 'react';

const variants = cva(
  ['inline-flex items-center whitespace-nowrap', 'px-2 py-1', 'font-mono text-3xs font-medium'],
  {
    variants: {
      shape: {
        square: 'rounded-sm',
        rounded: 'rounded-md',
      },
      uppercase: {
        true: 'uppercase tracking-meta',
        false: 'tracking-caption',
      },
      appearance: {
        tint: '',
        solid: 'text-white',
      },
      /** Colour comes from the `appearance` pairing below, never from `tone` alone. */
      tone: {
        accent: '',
        success: '',
        invalid: '',
        info: '',
        neutral: '',
        ink: '',
      },
    },
    compoundVariants: [
      // Amber on an Amber wash is too light to read, so accent takes the strong step.
      { tone: 'accent', appearance: 'tint', class: 'bg-accent/15 text-accent-strong' },
      { tone: 'success', appearance: 'tint', class: 'bg-success/15 text-success' },
      { tone: 'invalid', appearance: 'tint', class: 'bg-invalid/12 text-invalid' },
      { tone: 'info', appearance: 'tint', class: 'bg-background-info text-info' },
      { tone: 'neutral', appearance: 'tint', class: 'bg-background-alt text-foreground-muted' },
      { tone: 'ink', appearance: 'tint', class: 'bg-foreground/8 text-foreground' },

      { tone: 'accent', appearance: 'solid', class: 'bg-accent' },
      { tone: 'success', appearance: 'solid', class: 'bg-success' },
      { tone: 'invalid', appearance: 'solid', class: 'bg-invalid' },
      { tone: 'info', appearance: 'solid', class: 'bg-info' },
      { tone: 'neutral', appearance: 'solid', class: 'bg-foreground-subtle' },
      { tone: 'ink', appearance: 'solid', class: 'bg-foreground' },
    ],
    defaultVariants: {
      shape: 'square',
      uppercase: true,
      appearance: 'tint',
      tone: 'neutral',
    },
  }
);

export type BadgeProps = Omit<ComponentPropsWithRef<'span'>, 'className' | 'children'> &
  VariantProps<typeof variants> & {
    children: ReactNode;
    className?: string;
  };

/**
 * The classification primitive: a small rectangle naming what a thing *is* rather than
 * how it is going. A job type, an internal tag, a workshop reference.
 */
export const Badge = ({
  children,
  tone,
  appearance,
  shape,
  uppercase,
  className,
  ...rest
}: BadgeProps) => {
  return (
    <span
      data-testid="badge"
      {...rest}
      className={variants({ tone, appearance, shape, uppercase, className })}
    >
      {children}
    </span>
  );
};
