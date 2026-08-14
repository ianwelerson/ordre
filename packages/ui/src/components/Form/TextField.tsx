'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Field } from './Field';
import { controlVariants, type FieldOwnProps } from './fieldVariants';
import { useFieldControl } from './useFieldControl';

type TextFieldOwnProps = FieldOwnProps & {
  /** Sits inside the field box, before the control. */
  prefix?: ReactNode;
  /** Sits inside the field box, after the control. */
  suffix?: ReactNode;
};

type NativeInputProps = Omit<ComponentPropsWithRef<'input'>, keyof TextFieldOwnProps>;

export type TextFieldProps = TextFieldOwnProps & NativeInputProps;

/**
 * A single-line text control with its label and message.
 *
 * Everything the native input accepts passes straight through, so this drops into a
 * form as-is. `type` defaults to `text` and can be overridden - except for passwords,
 * which have their own control so the reveal toggle can own its state.
 */
export const TextField = ({ prefix, suffix, ...props }: TextFieldProps) => {
  const { fieldProps, controlProps } = useFieldControl<NativeInputProps>(props);

  return (
    <Field {...fieldProps}>
      {prefix}
      <input
        data-testid="text-field-control"
        type="text"
        {...controlProps}
        className={controlVariants({ size: fieldProps.size })}
      />
      {suffix}
    </Field>
  );
};
