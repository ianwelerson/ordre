'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';

import {
  type FieldValues,
  type Path,
  useForm,
  type UseFormProps,
  UseFormRegisterReturn,
  type UseFormReturn,
} from 'react-hook-form';

import { applyServiceError } from './applyServiceError';
import type { Translate } from './translate';

/**
 * Any schema implementing the Standard Schema interface. Zod 4 does, which is
 * why the generic resolver is used rather than the zod-specific one: the form
 * layer never needs to know which validator produced the schema.
 */
type StandardSchema<TValues extends FieldValues> = Parameters<
  typeof standardSchemaResolver<TValues, unknown, TValues>
>[0];

/** What a field control needs, ready to spread onto `TextField` and friends. */
export type FieldBinding = UseFormRegisterReturn & {
  invalid: boolean;
  invalidMessage?: string;
};

export interface AppFormOptions<TValues extends FieldValues> extends Omit<
  UseFormProps<TValues>,
  'resolver'
> {
  schema: StandardSchema<TValues>;
  /** The app's own translator - see `Translate`. */
  t: Translate;
}

export interface AppForm<TValues extends FieldValues> extends UseFormReturn<TValues> {
  /** Everything a control needs for `name`: registration, invalid state, translated message. */
  field: (name: Path<TValues>) => FieldBinding;
  /** Wraps a submit handler so a thrown `ServiceError` lands on the form. */
  submit: (
    handler: (values: TValues) => Promise<void> | void
  ) => ReturnType<UseFormReturn<TValues>['handleSubmit']>;
  /** The form-level message, translated and ready for an `Alert`. */
  rootError?: string;
  /** True while submitting *and* through a redirect that follows a success. */
  isBusy: boolean;
}

/**
 * The shared form mechanism: one schema in, bound fields and a submit out.
 *
 * Every app validates the same way for the same reasons, so the decisions live
 * here once rather than being re-argued per form:
 *
 * - **`onTouched`, then `onChange`.** Judge a field when the user leaves it, then
 *   correct live once it is already wrong. Validating from the first keystroke
 *   calls an email invalid while it is still being typed.
 * - **Messages are keys.** Schemas carry none (see the Zod error map in
 *   `@ordre/core/schemas`), so what reaches `errors.x.message` is
 *   `validation.email`, and `field()` resolves it through the injected `t`.
 * - **Failures are normalised.** `submit` catches, so no view writes the same
 *   `details`-versus-banner branch again.
 */
export const useAppForm = <TValues extends FieldValues>({
  schema,
  t,
  ...options
}: AppFormOptions<TValues>): AppForm<TValues> => {
  const form = useForm<TValues>({
    resolver: standardSchemaResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    ...options,
  });

  const {
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form;

  const field = (name: Path<TValues>): FieldBinding => {
    const message = errors[name]?.message;

    return {
      ...form.register(name),
      invalid: Boolean(message),
      invalidMessage: typeof message === 'string' ? t(message) : undefined,
    };
  };

  const submit: AppForm<TValues>['submit'] = (handler) =>
    form.handleSubmit(async (values) => {
      // Clear the previous attempt's banner. Field errors are re-derived by the
      // resolver on every submit, so they need no clearing.
      form.clearErrors('root');

      try {
        await handler(values);
      } catch (error) {
        applyServiceError(form, error);
      }
    });

  // Form state holds keys, never sentences - `field()` above and this line are
  // the only two places a key becomes text.
  const rootMessage = errors.root?.message;

  return {
    ...form,
    field,
    submit,
    rootError: typeof rootMessage === 'string' ? t(rootMessage) : undefined,
    // `isSubmitting` goes false the moment the handler resolves, but a success
    // usually starts a navigation that has not happened yet - without this the
    // button flicks back to idle for a beat before the page changes.
    isBusy: isSubmitting || isSubmitSuccessful,
  };
};
