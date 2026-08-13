import { cva } from 'class-variance-authority';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Typography } from '../Typography/Typography';

const variants = cva([
  'flex items-center gap-3',
  'before:h-px before:w-8 before:bg-foreground-subtle',
]);

export type EyebrowProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'children'> & {
  /** The label itself, set in the `mono-label` type scale. */
  children: ReactNode;
  /** Optional qualifier printed before the label, separated by a middot. */
  leading?: string;
  className?: string;
};

/**
 * The structural label that sits above a headline: a 32px rule, then mono uppercase
 * type. It carries the rule and the type scale only - the space between it and the
 * headline belongs to the layout, not here.
 *
 * `leading` prints a qualifier ahead of the label ("STEP 1 · SIGN IN"). The middot
 * between them is decoration, so it is hidden from the accessibility tree and the two
 * halves read as one phrase.
 *
 * The label is uppercased by the `mono-label` variant, so callers pass normal casing
 * and let the type scale do it - `aria-label` aside, a screen reader should not be
 * handed shouted text.
 */
export const Eyebrow = ({ children, leading, className, ...rest }: EyebrowProps) => {
  return (
    <div data-testid="eyebrow" {...rest} className={variants({ className })}>
      <Typography tag="p" variant="mono-label" className="flex items-center gap-2">
        {leading && (
          <>
            <span data-testid="eyebrow-leading">{leading}</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span data-testid="eyebrow-label">{children}</span>
      </Typography>
    </div>
  );
};
