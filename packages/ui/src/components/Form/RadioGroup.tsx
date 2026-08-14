'use client';

import { cva } from 'class-variance-authority';

import Icon from '../../icons/Icons';
import { Typography } from '../Typography/Typography';
import { FieldMessage } from './FieldMessage';
import { markVariants, optionLabelVariants, selectionFieldVariants } from './selectionVariants';
import { useFieldIdentity } from './useFieldIdentity';

const optionsVariants = cva('grid gap-x-3.5 gap-y-1.5', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
    },
  },
  defaultVariants: {
    columns: 1,
  },
});

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  /** Names the whole group, not any one option. */
  label?: string;
  options: RadioOption[];
  /** Controlled selection. Pair it with `onChange`. */
  value?: string;
  /** Uncontrolled starting selection. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** The quiet line under the group. Replaced by `invalidMessage` while invalid. */
  helper?: string;
  invalid?: boolean;
  /** Takes the helper's place while `invalid`. */
  invalidMessage?: string;
  /** Two columns suit short options; anything that wraps wants one. */
  columns?: 1 | 2;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * A group of radios, of which exactly one can be chosen.
 *
 * Selection stays with the browser: each option is a real radio sharing one `name`, so
 * arrow keys move between them for free.
 *
 * The group is a `div` with `role="radiogroup"` rather than a `fieldset`. A `legend` is
 * rendered into its fieldset's border instead of as a child box, which takes it out of
 * the flex column and leaves the group label with none of the spacing the rest of the
 * stack gets. `aria-labelledby` names the group just as well without that.
 */
export const RadioGroup = ({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  helper,
  invalid,
  invalidMessage,
  columns,
  disabled,
  className,
  id,
}: RadioGroupProps) => {
  const { controlId, messageId, message, describedBy } = useFieldIdentity({
    name,
    id,
    helper,
    invalid,
    invalidMessage,
  });
  const labelId = `${controlId}-label`;

  return (
    <div
      data-testid="radio-group"
      role="radiogroup"
      id={controlId}
      aria-labelledby={label ? labelId : undefined}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={selectionFieldVariants({ className })}
    >
      {label && (
        <Typography id={labelId} tag="span" variant="mono-label">
          {label}
        </Typography>
      )}
      <div className={optionsVariants({ columns })}>
        {options.map((option) => (
          <label key={option.value} className="flex w-fit cursor-pointer items-center gap-2">
            <input
              data-testid="radio-group-option"
              type="radio"
              name={name}
              value={option.value}
              disabled={disabled ?? option.disabled}
              className="peer sr-only"
              {...(value === undefined
                ? { defaultChecked: defaultValue === option.value }
                : { checked: value === option.value })}
              onChange={(event) => onChange?.(event.target.value)}
            />
            {/* Decorative: the radio beside it is what assistive tech reads. */}
            <span aria-hidden className={markVariants({ shape: 'dot', invalid })}>
              <Icon name="check" size={10} />
            </span>
            <span className={optionLabelVariants()}>{option.label}</span>
          </label>
        ))}
      </div>
      <FieldMessage id={messageId} message={message} invalid={invalid} />
    </div>
  );
};
