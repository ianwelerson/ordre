'use client';

import { cva } from 'class-variance-authority';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Typography } from '../Typography/Typography';
import { FieldMessage } from './FieldMessage';
import { selectionFieldVariants } from './selectionVariants';
import { useFieldIdentity } from './useFieldIdentity';

/**
 * The track, with the knob as its `::after`.
 *
 * The knob has to be drawn by the track rather than nested inside it: `peer-*` reaches
 * siblings only, and a nested element is a sibling's child, so it would never see the
 * input's checked state. As a pseudo-element it inherits the track's selector instead.
 *
 * Inset 2px on every side, so its travel is the track's width less its own.
 */
const trackVariants = cva(
  [
    'relative h-5 w-9 shrink-0 rounded-full bg-border',
    'transition-all duration-base ease-standard',
    'after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full',
    'after:bg-background-elevated after:shadow-knob',
    'after:transition-transform after:duration-base after:ease-standard',
    'peer-checked:bg-button peer-checked:after:translate-x-4',
    'peer-focus-visible:shadow-amber peer-disabled:cursor-not-allowed peer-disabled:opacity-40',
  ],
  {
    variants: {
      // A recoloured track would read as the other position, so the signal goes on the
      // ring instead and leaves on/off saying only what it says.
      invalid: {
        true: 'shadow-invalid',
        false: '',
      },
    },
    defaultVariants: {
      invalid: false,
    },
  }
);

type ToggleOwnProps = {
  name: string;
  /** The text beside the switch. Clicking it flips the control. */
  label: ReactNode;
  /** A second line under the label, for what turning it on actually does. */
  description?: string;
  /** The quiet line under the field. Replaced by `invalidMessage` while invalid. */
  helper?: string;
  invalid?: boolean;
  /** Takes the helper's place while `invalid`. */
  invalidMessage?: string;
  className?: string;
};

type NativeToggleProps = Omit<ComponentPropsWithRef<'input'>, keyof ToggleOwnProps | 'type'>;

export type ToggleProps = ToggleOwnProps & NativeToggleProps;

/**
 * An on/off switch, laid out as a row with its label leading and the switch trailing.
 *
 * A checkbox underneath rather than a button, so it submits with the form and reads as
 * a switch to assistive tech. Rows carry no rule of their own - a list of them is what
 * decides whether they are separated.
 */
export const Toggle = ({
  name,
  label,
  description,
  helper,
  invalid,
  invalidMessage,
  className,
  id,
  ...rest
}: ToggleProps) => {
  const { controlId, messageId, message, describedBy } = useFieldIdentity({
    name,
    id,
    helper,
    invalid,
    invalidMessage,
  });

  return (
    <div data-testid="toggle-field" className={selectionFieldVariants({ className })}>
      <label htmlFor={controlId} className="flex cursor-pointer items-center gap-4">
        <input
          data-testid="toggle-control"
          type="checkbox"
          role="switch"
          {...rest}
          id={controlId}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="peer sr-only"
        />
        <span className="flex flex-1 flex-col gap-1">
          <Typography tag="span" variant="caption" tone="muted">
            {label}
          </Typography>
          {description && (
            <Typography tag="span" variant="caption">
              {description}
            </Typography>
          )}
        </span>
        {/* Decorative: the input beside it is what assistive tech reads and operates. */}
        <span aria-hidden className={trackVariants({ invalid })} />
      </label>
      <FieldMessage id={messageId} message={message} invalid={invalid} />
    </div>
  );
};
