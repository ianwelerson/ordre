'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import Icon from '../../icons/Icons';
import { Typography } from '../Typography/Typography';
import { FieldMessage } from './FieldMessage';
import { markVariants, selectionFieldVariants } from './selectionVariants';
import { useFieldIdentity } from './useFieldIdentity';

type CheckboxOwnProps = {
  name: string;
  /** The text beside the box. Clicking it toggles the control. */
  label: ReactNode;
  /** A second line under the label, for what ticking the box actually does. */
  description?: string;
  /** The quiet line under the field. Replaced by `invalidMessage` while invalid. */
  helper?: string;
  invalid?: boolean;
  /** Takes the helper's place while `invalid`. */
  invalidMessage?: string;
  className?: string;
};

type NativeCheckboxProps = Omit<ComponentPropsWithRef<'input'>, keyof CheckboxOwnProps | 'type'>;

export type CheckboxProps = CheckboxOwnProps & NativeCheckboxProps;

/**
 * A single checkbox with its label and message.
 *
 * The native input stays in the tree and keeps every behaviour that comes with it -
 * space to toggle, form submission, `indeterminate` - while a sibling draws the mark.
 */
export const Checkbox = ({
  name,
  label,
  description,
  helper,
  invalid,
  invalidMessage,
  className,
  id,
  ...rest
}: CheckboxProps) => {
  const { controlId, messageId, message, describedBy } = useFieldIdentity({
    name,
    id,
    helper,
    invalid,
    invalidMessage,
  });

  return (
    <div data-testid="checkbox-field" className={selectionFieldVariants({ className })}>
      <label htmlFor={controlId} className="flex w-fit cursor-pointer items-start gap-2.5">
        <input
          data-testid="checkbox-control"
          type="checkbox"
          {...rest}
          id={controlId}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="peer sr-only"
        />
        {/*
          Decorative: the input beside it is what assistive tech reads and operates.

          The row aligns to the top so the mark stays on the first line when a
          description wraps below it. Nudged down by half the difference between the
          caption's line box and the mark, which centres it against that first line.
        */}
        <span aria-hidden className={markVariants({ shape: 'box', invalid, className: 'mt-0.5' })}>
          <Icon name="check" size={12} />
        </span>
        <span className="flex flex-col gap-1">
          <Typography tag="span" variant="caption" tone="muted">
            {label}
          </Typography>
          {description && (
            <Typography tag="span" variant="caption">
              {description}
            </Typography>
          )}
        </span>
      </label>
      <FieldMessage id={messageId} message={message} invalid={invalid} />
    </div>
  );
};
