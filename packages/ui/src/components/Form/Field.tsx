import type { ReactNode } from 'react';

import { Typography } from '../Typography/Typography';
import { FieldMessage } from './FieldMessage';
import {
  type FieldOwnProps,
  type FieldSize,
  type FieldVariant,
  fieldVariants,
  LABEL_STYLE,
  shellVariants,
} from './fieldVariants';

export interface FieldProps extends Omit<
  FieldOwnProps,
  'name' | 'variant' | 'size' | 'helper' | 'invalidMessage'
> {
  /** Id of the control this field labels. */
  controlId: string;
  /** Id given to the message line, for the control's `aria-describedby`. */
  messageId: string;
  variant: FieldVariant;
  size: FieldSize;
  /**
   * The single line under the field, already picked from the helper and the error by
   * `useFieldControl`. One slot holds one at a time, so the field never grows a second
   * row and shifts the form under it.
   */
  message?: string;
  /** Grows the box and top-aligns its contents, for a textarea. */
  multiline?: boolean;
  /** The control, plus any prefix or suffix that shares its box. */
  children: ReactNode;
}

/**
 * The furniture around a form control: label, the box it sits in, and the one line of
 * helper or error text below it.
 *
 * Not exported from the package. Controls compose it rather than consumers, so every
 * field ends up with the same anatomy without anyone having to assemble it.
 */
export const Field = ({
  controlId,
  messageId,
  variant,
  size,
  label,
  optional,
  invalid,
  message,
  multiline,
  className,
  children,
}: FieldProps) => {
  const labelStyle = LABEL_STYLE[variant];

  return (
    <div data-testid="field" className={fieldVariants({ className })}>
      {label && (
        <label htmlFor={controlId} className="flex w-fit items-center gap-2.5">
          <Typography tag="span" variant={labelStyle.variant} tone={labelStyle.tone}>
            {label}
          </Typography>
          {optional && (
            <span
              data-testid="field-optional"
              className="text-3xs tracking-label text-foreground-subtle bg-background-alt border-border rounded-sm border border-solid px-1.5 py-0.5 font-mono uppercase"
            >
              Optional
            </span>
          )}
        </label>
      )}
      <div
        data-testid="field-shell"
        className={shellVariants({ variant, size, multiline, invalid })}
      >
        {children}
      </div>
      <FieldMessage id={messageId} message={message} invalid={invalid} />
    </div>
  );
};
