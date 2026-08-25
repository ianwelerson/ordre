import { cva, type VariantProps } from 'class-variance-authority';

import type { ReactNode } from 'react';

import type { TypographyProps } from '../Typography/Typography';

/**
 * The box a control sits in, on two independent axes.
 *
 * `variant` is the surface: `outlined` sits on an elevated background behind a visible
 * border, `filled` on a tinted one that lifts to elevated on focus. `size` is the
 * geometry, on the same steps as Button so a field and the button beside it line up.
 */
export const shellVariants = cva(
  'flex w-full gap-2.5 rounded-md border border-solid transition-all duration-base ease-standard',
  {
    variants: {
      variant: {
        outlined: 'bg-background-elevated',
        filled: 'bg-background-alt focus-within:bg-background-elevated',
      },
      size: {
        sm: 'px-3',
        md: 'px-3.5',
        lg: 'px-4',
        xl: 'px-4',
      },
      multiline: {
        true: 'min-h-24 items-start py-3',
        false: 'items-center',
      },
      // Declared empty so it can be paired below. On its own it emits nothing.
      invalid: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      /**
       * Only the single-line box takes a height; the multiline one has a floor and
       * grows past it, so a fixed height would fight the content.
       */
      { size: 'sm', multiline: false, class: 'h-8' },
      { size: 'md', multiline: false, class: 'h-10' },
      { size: 'lg', multiline: false, class: 'h-12' },
      { size: 'xl', multiline: false, class: 'h-13' },
      {
        variant: 'outlined',
        invalid: false,
        class: 'border-border focus-within:border-accent focus-within:shadow-accent',
      },
      {
        variant: 'outlined',
        invalid: true,
        class: 'border-invalid focus-within:border-invalid focus-within:shadow-invalid',
      },
      { variant: 'filled', invalid: false, class: 'border-transparent focus-within:border-accent' },
      // Filled rests on a transparent border, so invalid is what makes one appear.
      { variant: 'filled', invalid: true, class: 'border-invalid' },
    ],
    defaultVariants: {
      variant: 'outlined',
      size: 'md',
      multiline: false,
      invalid: false,
    },
  }
);

/**
 * The control itself, stripped bare. Every piece of chrome lives on the shell, so a
 * prefix, a suffix or a password toggle can share the box without fighting a border.
 */
export const controlVariants = cva(
  'font-body text-foreground min-w-0 flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-foreground-subtle',
  {
    variants: {
      // Type scales with the box, not the surface: a field is not a different size for
      // being white.
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/** The wrapper that stacks label, shell and message. */
export const fieldVariants = cva('flex w-full flex-col gap-1.5');

export type FieldVariant = NonNullable<VariantProps<typeof shellVariants>['variant']>;
export type FieldSize = NonNullable<VariantProps<typeof shellVariants>['size']>;

/**
 * What every field control takes on top of its native element's own props.
 *
 * The single declaration of this set: the controls build their public props from it,
 * `Field` builds the shape it renders from it, and `useFieldControl` splits a bag of
 * them apart. Adding a field-level prop is one edit here.
 */
export interface FieldOwnProps {
  /** Names the native control, and seeds its id when the caller gives none. */
  name: string;
  variant?: FieldVariant;
  size?: FieldSize;
  label?: string;
  /**
   * Sits at the far end of the label row, for something the field itself cannot say -
   * a "Forgot?" link beside a password, a unit toggle beside an amount.
   *
   * It renders beside the `label` element rather than inside it. Nesting a control in
   * a label makes the two fight over the same click.
   */
  labelAction?: ReactNode;
  /** Tags the label to say the field can be left empty. */
  optional?: boolean;
  /** The quiet line under the field. Replaced by `invalidMessage` while invalid. */
  helper?: string;
  invalid?: boolean;
  /** Takes the helper's place while `invalid`. */
  invalidMessage?: string;
  /** Lands on the field wrapper, not on the control. */
  className?: string;
}

type LabelStyle = Required<Pick<TypographyProps, 'variant' | 'tone'>>;

/**
 * How each surface sets its label: `outlined` takes the mono uppercase tag, `filled`
 * the quieter sans one.
 */
export const LABEL_STYLE: Record<FieldVariant, LabelStyle> = {
  outlined: { variant: 'mono-label', tone: 'subtle' },
  filled: { variant: 'caption', tone: 'muted' },
};
