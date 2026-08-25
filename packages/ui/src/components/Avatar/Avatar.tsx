import { cva, type VariantProps } from 'class-variance-authority';

import type { ComponentPropsWithRef } from 'react';

const variants = cva(
  ['rounded-full border border-solid', 'flex items-center justify-center', 'overflow-hidden'],
  {
    variants: {
      size: {
        xs: 'h-7 w-7',
        sm: 'h-9 w-9',
        md: 'h-13 w-13',
        lg: 'h-16 w-16',
      },
      tone: {
        light: 'bg-background-alt border-border',
        ink: 'bg-foreground border-foreground',
      },
      inset: {
        true: '',
        false: '',
      },
    },
    /**
     * The inset scales with the circle, so a logo keeps the same optical margin at
     * every size. Only the `true` side emits padding, so an edge-to-edge avatar never
     * has to undo one.
     */
    compoundVariants: [
      { size: 'xs', inset: true, class: 'p-1' },
      { size: 'sm', inset: true, class: 'p-1.5' },
      { size: 'md', inset: true, class: 'p-2' },
      { size: 'lg', inset: true, class: 'p-2.5' },
    ],
    defaultVariants: {
      size: 'md',
      tone: 'light',
      inset: false,
    },
  }
);

/**
 * Not `Typography`: the mono steps here climb with the circle, and `mono-label` is
 * pinned to one size. Same family and weight, own ladder.
 */
const labelVariants = cva(['font-mono font-medium'], {
  variants: {
    size: {
      xs: 'text-2xs',
      sm: 'text-xs',
      md: 'text-lg',
      lg: 'text-xl',
    },
    tone: {
      light: 'text-foreground-muted',
      ink: 'text-accent',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'light',
  },
});

const firstCharOf = (word: string) => [...word][0] ?? '';

/**
 * First and last initial: "Ada Lovelace" reads AL, "Bike Shop" reads BS.
 *
 * One word gives one letter rather than two from the same word - "BI" for "Bike"
 * would read as an abbreviation of something else. The middle is dropped, so a long
 * name never overflows the circle.
 */
const initialsOf = (label: string) => {
  const words = label.trim().split(/\s+/);
  const first = words[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1] ?? '') : '';

  return `${firstCharOf(first)}${firstCharOf(last)}`.toUpperCase();
};

export type AvatarProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'children'> &
  VariantProps<typeof variants> & {
    label: string;
    image?: string;
    className?: string;
  };

/**
 * The identity primitive: a circle carrying either an image or the initials of the
 * thing it stands for.
 *
 * The accessible name is `label` in both cases, so an avatar reads as "Ada Lovelace"
 * rather than as "AL" - initials are a visual shorthand and say nothing out loud. In
 * the initials case the circle takes `role="img"` to carry that name, and in the
 * image case the `img` already has it.
 */
export const Avatar = ({ label, image, size, tone, inset, className, ...rest }: AvatarProps) => {
  return (
    <div
      data-testid="avatar"
      {...rest}
      {...(image ? {} : { role: 'img', 'aria-label': label })}
      className={variants({ size, tone, inset, className })}
    >
      {image ? (
        <img
          data-testid="avatar-image"
          src={image}
          alt={label}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          data-testid="avatar-initials"
          aria-hidden="true"
          className={labelVariants({ size, tone })}
        >
          {initialsOf(label)}
        </span>
      )}
    </div>
  );
};
