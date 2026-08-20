'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';

import {
  type FieldError,
  type FieldErrors,
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
 * Every field path currently carrying an error, in `a.b.c` form.
 *
 * `root` is skipped wherever it appears: it names the form-level banner rather
 * than a field, and `trigger` has nothing to validate under it.
 */
const errorPaths = (errors: FieldErrors, prefix = ''): string[] =>
  Object.entries(errors).flatMap(([name, node]) => {
    if (!node || name === 'root') {
      return [];
    }

    const path = prefix ? `${prefix}.${name}` : name;

    return typeof (node as FieldError).type === 'string'
      ? [path]
      : errorPaths(node as FieldErrors, path);
  });

/**
 * The shared form mechanism: one schema in, bound fields and a submit out.
 *
 * Every app validates the same way for the same reasons, so the decisions live
 * here once rather than being re-argued per form:
 *
 * - **Only typed fields are judged early.** A field is validated when the user
 *   leaves it *having typed in it*, and corrected live from there on - across
 *   every flagged field rather than only the one being edited, so a cross-field
 *   rule clears from either side. Everything else waits for submit. Validating
 *   from the first keystroke calls an email invalid while it is still being
 *   typed; judging an untouched field on blur is worse, because an autofocused
 *   empty email would sprout an error the moment the user reaches for a link,
 *   moving that link out from under the click. RHF has no such mode, so
 *   `field()` builds it: base mode `onSubmit`, with blur and change handlers
 *   that trigger validation themselves once a field has earned it.
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
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    ...options,
  });

  const {
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form;

  const field = (name: Path<TValues>): FieldBinding => {
    // `form.formState` so this reads the snapshot the render is drawing from.
    const message = form.getFieldState(name, form.formState).error?.message;
    const registration = form.register(name);

    return {
      ...registration,
      onChange: async (event) => {
        await registration.onChange(event);

        // `control._formState`, not `form.formState`: the snapshot is a keystroke
        // behind by the time a change handler runs.
        const errored = errorPaths(form.control._formState.errors) as Path<TValues>[];

        if (errored.length > 0) {
          await form.trigger(errored);
        }
      },
      onBlur: async (event) => {
        await registration.onBlur(event);

        if (form.getFieldState(name).isDirty) {
          await form.trigger(name);
        }
      },
      invalid: Boolean(message),
      invalidMessage: typeof message === 'string' ? t(message) : undefined,
    };
  };

  const submit: AppForm<TValues>['submit'] = (handler) =>
    form.handleSubmit(async (values) => {
      form.clearErrors('root');

      try {
        await handler(values);
      } catch (error) {
        applyServiceError(form, error);
      }
    });

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
