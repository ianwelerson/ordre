import { cva, type VariantProps } from 'class-variance-authority';
import { type IconName as LucideIconName } from 'lucide-react/dynamic';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import Icon from '../../icons/Icons';

const variants = cva(
  [
    'inline-flex items-center gap-1.5 whitespace-nowrap',
    'rounded-full border border-solid',
    'font-mono font-medium',
  ],
  {
    variants: {
      size: {
        sm: 'text-3xs px-2 py-1',
        md: 'text-2xs px-2.5 py-1',
      },
      uppercase: {
        true: 'uppercase tracking-label',
        false: 'tracking-caption',
      },
      /**
       * Claims the class families the tone table below leaves alone. Classes here are
       * concatenated, not merged, so each family has to be emitted exactly once.
       */
      appearance: {
        tint: 'border-transparent',
        solid: 'border-transparent text-white',
        outline: 'bg-background-elevated border-border',
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

      { tone: 'accent', appearance: 'outline', class: 'text-accent-strong' },
      { tone: 'success', appearance: 'outline', class: 'text-success' },
      { tone: 'invalid', appearance: 'outline', class: 'text-invalid' },
      { tone: 'info', appearance: 'outline', class: 'text-info' },
      { tone: 'neutral', appearance: 'outline', class: 'text-foreground-subtle' },
      { tone: 'ink', appearance: 'outline', class: 'text-foreground' },
    ],
    defaultVariants: {
      size: 'md',
      uppercase: false,
      appearance: 'tint',
      tone: 'neutral',
    },
  }
);

type ChipSize = NonNullable<VariantProps<typeof variants>['size']>;

const ICON_SIZE: Record<ChipSize, number> = {
  sm: 12,
  md: 14,
};

type ChipBaseProps = Omit<ComponentPropsWithRef<'span'>, 'className' | 'children'> &
  VariantProps<typeof variants> & {
    children: ReactNode;
    className?: string;
  };

export type ChipWithDot = ChipBaseProps & {
  /** A small filled circle before the label, in the tone's colour. */
  dot?: boolean;
  icon?: never;
};

export type ChipWithIcon = ChipBaseProps & {
  /** A glyph before the label. */
  icon?: LucideIconName;
  dot?: never;
};

/** A dot and an icon are alternatives, never a pair: asking for both is a type error. */
export type ChipProps = ChipWithDot | ChipWithIcon;

/**
 * The status primitive: a pill stating the condition of the thing beside it.
 *
 * `tone` is semantic rather than domain - `success`, not `done` - so an app maps its
 * own status vocabulary onto it at the call site.
 */
export const Chip = ({
  children,
  tone,
  appearance,
  size,
  uppercase,
  dot,
  icon,
  className,
  ...rest
}: ChipProps) => {
  const currentSize = size ?? 'md';

  return (
    <span
      data-testid="chip"
      {...rest}
      className={variants({ tone, appearance, size, uppercase, className })}
    >
      {dot && (
        <span
          data-testid="chip-dot"
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current opacity-85"
        />
      )}
      {icon && (
        <Icon
          name={icon}
          data-testid="chip-icon"
          size={ICON_SIZE[currentSize]}
          className="shrink-0"
        />
      )}
      <span data-testid="chip-label">{children}</span>
    </span>
  );
};
