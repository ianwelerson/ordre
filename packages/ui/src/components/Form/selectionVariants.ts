import { cva } from 'class-variance-authority';

/**
 * The mark a checkbox or a radio draws beside its label.
 *
 * The real control sits next to this as a screen-reader-only `peer`, so the browser
 * still owns checked state, keyboard handling and form submission while the mark takes
 * the styling. Every visual state is therefore a `peer-*` variant rather than a prop.
 *
 * `invalid` carries the full border and fill for both checked and unchecked, so only
 * one branch ever emits them: this package has no tailwind-merge, and an invalid
 * control that turned neutral the moment it was ticked would lose the signal.
 */
export const markVariants = cva(
  [
    'grid shrink-0 place-items-center border border-solid text-transparent',
    'transition-all duration-base ease-standard',
    'peer-checked:text-amber peer-focus-visible:shadow-amber',
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-40',
  ],
  {
    variants: {
      shape: {
        box: 'size-4 rounded-sm',
        dot: 'size-3.5 rounded-full',
      },
      invalid: {
        false:
          'border-border bg-background-elevated peer-checked:border-foreground peer-checked:bg-foreground',
        true: 'border-invalid bg-background-elevated peer-checked:border-invalid peer-checked:bg-invalid',
      },
    },
    defaultVariants: {
      shape: 'box',
      invalid: false,
    },
  }
);

/**
 * The text beside a mark.
 *
 * Not a `Typography` variant: the colour has to answer to the peer's checked state,
 * and `Typography` emits a colour of its own that would collide with the one the
 * `peer-checked` variant adds.
 */
export const optionLabelVariants = cva(
  'font-body text-xs leading-caption transition-all duration-base ease-standard',
  {
    variants: {
      selected: {
        // The peer selector outweighs the resting colour on specificity, so the two
        // resolve by intent rather than by stylesheet order.
        responsive: 'text-foreground-subtle peer-checked:text-foreground',
        static: 'text-foreground-muted',
      },
    },
    defaultVariants: {
      selected: 'responsive',
    },
  }
);

/** The stack a selection control and its message sit in. */
export const selectionFieldVariants = cva('flex w-full flex-col gap-1.5');
