'use client';

import type { ComponentPropsWithRef } from 'react';

import { Field } from './Field';
import { controlVariants, type FieldOwnProps } from './fieldVariants';
import { useFieldControl } from './useFieldControl';

type NativeTextAreaProps = Omit<ComponentPropsWithRef<'textarea'>, keyof FieldOwnProps>;

export type TextAreaProps = FieldOwnProps & NativeTextAreaProps;

/**
 * The multi-line sibling of {@link TextField}, sharing its box and its anatomy.
 *
 * The box floors at 100px and grows with `rows`. Manual resizing is off: a field that
 * can be dragged out of the form's rhythm is a field that will be.
 */
export const TextArea = (props: TextAreaProps) => {
  const { fieldProps, controlProps } = useFieldControl<NativeTextAreaProps>(props);

  return (
    <Field {...fieldProps} multiline>
      <textarea
        data-testid="text-area-control"
        {...controlProps}
        className={controlVariants({
          size: fieldProps.size,
          className: 'resize-none self-stretch',
        })}
      />
    </Field>
  );
};
