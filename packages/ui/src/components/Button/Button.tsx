'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { type IconName as LucideIconName } from 'lucide-react/dynamic';

import { type ComponentPropsWithRef, type ReactNode } from 'react';

import Icon from './../../icons/Icons';

const variants = cva(
  [
    'font-body inline-flex flex-row items-center gap-2 whitespace-nowrap',
    'border border-solid border-transparent font-medium tracking-[-0.005em]',
    'transition-all duration-base ease-standard hover:cursor-pointer',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
    'aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-button hover:bg-button-hover active:bg-button-hover text-white',
        secondary:
          'border-border! text-foreground hover:bg-background-alt active:bg-background-alt bg-transparent',
        ghost: 'text-foreground hover:bg-background-alt active:bg-background-alt bg-transparent',
        ink: 'bg-foreground hover:bg-foreground-muted active:bg-foreground-muted text-white',
        destructive: 'bg-invalid hover:bg-invalid-hover active:bg-invalid-hover text-white',
      },
      // Only the type scale here. The box is set per size/iconOnly pair below, so
      // that a padded button and a square one never both emit a padding class.
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-base',
      },
      shape: {
        rounded: 'rounded-md',
        pill: 'rounded-full',
      },
      align: {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        between: 'justify-between',
      },
      // `inline-flex` already shrinks to content, so the off state needs no width.
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      iconOnly: {
        true: 'justify-center',
        false: '',
      },
    },
    compoundVariants: [
      { size: 'sm', iconOnly: false, class: 'h-8 px-3' },
      { size: 'md', iconOnly: false, class: 'h-10 px-4.5' },
      { size: 'lg', iconOnly: false, class: 'h-12 px-6' },
      { size: 'xl', iconOnly: false, class: 'h-13 px-7' },
      // Square hit targets. 44px at `md` is the design system's burger/close control.
      { size: 'sm', iconOnly: true, class: 'size-8' },
      { size: 'md', iconOnly: true, class: 'size-11' },
      { size: 'lg', iconOnly: true, class: 'size-12' },
      { size: 'xl', iconOnly: true, class: 'size-13' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'rounded',
      align: 'center',
      fullWidth: false,
      iconOnly: false,
    },
  }
);

type ButtonSize = NonNullable<VariantProps<typeof variants>['size']>;

/** Icon rendered alongside a label. */
const ICON_SIZE: Record<ButtonSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
};

/**
 * Icon rendered on its own, so it carries the whole button.
 *
 * Lucide draws inside a 24 viewBox with a 3px inset on each edge, so the visible
 * glyph is only 75% of the size passed here. These are the design system's glyph
 * sizes (18px for the 44px burger, and so on) divided back out by that 0.75.
 */
const ICON_ONLY_SIZE: Record<ButtonSize, number> = {
  sm: 16,
  md: 24,
  lg: 26,
  xl: 28,
};

type ButtonBaseProps = Omit<VariantProps<typeof variants>, 'iconOnly'> & {
  children?: ReactNode;
  /** Icon placed before the label. Renders on its own when there is no label. */
  leadingIcon?: LucideIconName;
  /** Icon placed after the label. Renders on its own when there is no label. */
  trailingIcon?: LucideIconName;
  className?: string;
};

export type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentPropsWithRef<'button'>, keyof ButtonBaseProps> & { href?: never };

export type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentPropsWithRef<'a'>, keyof ButtonBaseProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * The action primitive. Renders an `a` when given `href`, a `button` otherwise.
 *
 * Dropping the label turns it into a square icon-only control at the design system's
 * hit-target sizes. Note that classes are concatenated, not merged, so a `className`
 * that fights a variant class resolves by stylesheet order rather than by the order
 * written here: prefer a variant over an override.
 */
export const Button = ({
  children,
  variant,
  size,
  shape,
  align,
  fullWidth,
  leadingIcon,
  trailingIcon,
  href,
  className,
  ...rest
}: ButtonProps) => {
  const currentSize = size ?? 'md';
  const hasLabel = Boolean(children);
  const iconOnly = !hasLabel && Boolean(leadingIcon ?? trailingIcon);
  const iconSize = iconOnly ? ICON_ONLY_SIZE[currentSize] : ICON_SIZE[currentSize];

  const classes = variants({ variant, size, shape, align, fullWidth, iconOnly, className });
  const content = (
    <>
      {leadingIcon && (
        <Icon
          name={leadingIcon}
          data-testid="button-leading-icon"
          size={iconSize}
          className="shrink-0"
        />
      )}
      {hasLabel && <span data-testid="button-text">{children}</span>}
      {trailingIcon && (
        <Icon
          name={trailingIcon}
          data-testid="button-trailing-icon"
          size={iconSize}
          className="shrink-0"
        />
      )}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        data-testid="button"
        {...(rest as ComponentPropsWithRef<'a'>)}
        href={href}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      data-testid="button"
      type="button"
      {...(rest as ComponentPropsWithRef<'button'>)}
      className={classes}
    >
      {content}
    </button>
  );
};
