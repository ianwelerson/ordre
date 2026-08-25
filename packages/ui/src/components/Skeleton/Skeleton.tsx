import { cva, type VariantProps } from 'class-variance-authority';

import type { ComponentPropsWithRef } from 'react';

const variants = cva(['bg-foreground/8', 'animate-pulse motion-reduce:animate-none'], {
  variants: {
    shape: {
      line: 'rounded-sm',
      block: 'rounded-lg',
      circle: 'rounded-full',
    },
  },
  defaultVariants: {
    shape: 'line',
  },
});

export type SkeletonProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'children'> &
  VariantProps<typeof variants> & {
    /**
     * Announces the wait to a screen reader. Put it on one skeleton per loading region -
     * a stack of them each announcing itself buries the message, which is why an
     * unlabelled skeleton is hidden from the accessibility tree instead.
     */
    label?: string;
    className?: string;
  };

/**
 * The placeholder primitive: a pulsing box standing in for content that has not
 * arrived. One component shaped by props - everything past the rectangle is layout.
 *
 * It carries no width or height. Those belong to the content it is impersonating, so
 * they come from the caller: `<Skeleton className="h-4 w-40" />`.
 */
export const Skeleton = ({ shape, label, className, ...rest }: SkeletonProps) => {
  return (
    <div
      data-testid="skeleton"
      {...rest}
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': true })}
      className={variants({ shape, className })}
    />
  );
};
