import { cva, type VariantProps } from 'class-variance-authority';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Typography } from '../Typography/Typography';

const variants = cva(['flex items-center before:flex-1 after:flex-1'], {
  variants: {
    orientation: {
      horizontal: 'w-full flex-row before:h-px after:h-px',
      vertical: 'h-full flex-col self-stretch before:w-px after:w-px',
    },
    tone: {
      standard: 'before:bg-border after:bg-border',
      subtle: 'before:bg-border/30 after:bg-border/30',
    },
    labelled: {
      true: 'gap-3.5',
      false: '',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    tone: 'standard',
    labelled: false,
  },
});

type DividerBaseProps = Omit<VariantProps<typeof variants>, 'labelled'> &
  Omit<ComponentPropsWithRef<'div'>, 'className' | 'children'> & {
    className?: string;
  };

export type DividerAsHorizontal = DividerBaseProps & {
  orientation?: 'horizontal';
  /** Label centred between the two rules, set in the `mono-label` type scale. */
  children?: ReactNode;
};

export type DividerAsVertical = DividerBaseProps & {
  orientation: 'vertical';
  /** A vertical rule takes no label - the type would have to turn on its side. */
  children?: never;
};

export type DividerProps = DividerAsHorizontal | DividerAsVertical;

/**
 * A 1px rule, optionally broken by a label. `orientation` picks the axis and `tone`
 * picks how loud the line is; spacing around it belongs to the layout, not here.
 *
 * A non-focusable `separator` has presentational children, so a screen reader would
 * drop the visible label. A plain-text label is therefore lifted into `aria-label` so
 * the two can never drift apart; richer children need an `aria-label` from the caller.
 */
export const Divider = ({
  children,
  orientation,
  tone,
  className,
  'aria-label': ariaLabel,
  ...rest
}: DividerProps) => {
  const labelled = Boolean(children);

  return (
    <div
      data-testid="divider"
      role="separator"
      aria-orientation={orientation ?? 'horizontal'}
      aria-label={ariaLabel ?? (typeof children === 'string' ? children : undefined)}
      {...rest}
      className={variants({ orientation, tone, labelled, className })}
    >
      {labelled && (
        <Typography tag="span" variant="mono-label" className="shrink-0">
          {children}
        </Typography>
      )}
    </div>
  );
};
