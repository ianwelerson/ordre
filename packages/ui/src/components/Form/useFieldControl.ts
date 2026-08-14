'use client';

import type { FieldProps } from './Field';
import type { FieldOwnProps } from './fieldVariants';
import { useFieldIdentity } from './useFieldIdentity';

/** The identity and state attributes every field control carries. */
type ControlAttributes = {
  id: string;
  name: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
};

interface FieldControl<TControl> {
  /** Spread onto `Field`. */
  fieldProps: Omit<FieldProps, 'multiline' | 'children'>;
  /** Spread onto the native element, which `TControl` names. */
  controlProps: TControl & ControlAttributes;
}

/**
 * Splits a control's props into the two halves that go to different places: what the
 * field renders around the control, and what belongs on the control itself.
 *
 * This owns the defaults for `variant` and `size`. Controls that resolved either
 * themselves would give the field two sources of truth for the same answer.
 *
 * `TControl` names the native element's prop type and has to be passed explicitly -
 * what is left after the field's own props are taken out is opaque from in here.
 */
export const useFieldControl = <TControl extends object>({
  name,
  id,
  variant = 'outlined',
  size = 'md',
  label,
  labelAction,
  optional,
  helper,
  invalid,
  invalidMessage,
  className,
  ...rest
}: FieldOwnProps & { id?: string }): FieldControl<TControl> => {
  const { controlId, messageId, message, describedBy } = useFieldIdentity({
    name,
    id,
    helper,
    invalid,
    invalidMessage,
  });

  return {
    fieldProps: {
      controlId,
      messageId,
      variant,
      size,
      label,
      labelAction,
      optional,
      invalid,
      message,
      className,
    },
    controlProps: {
      ...(rest as TControl),
      id: controlId,
      name,
      'aria-invalid': invalid,
      'aria-describedby': describedBy,
    },
  };
};
