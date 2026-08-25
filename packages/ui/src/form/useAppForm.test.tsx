import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { z } from '@ordre/core/schemas';

import type { FieldBinding } from './useAppForm';
import { useAppForm } from './useAppForm';

/**
 * The shape the set-password form takes: two fields, plus a rule that belongs to
 * neither of them.
 */
const Schema = z
  .object({
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof Schema>;

/** Keys in, keys out: what a form stores is never a sentence. */
const t = (key: string) => key;

const Field = ({ binding, name }: { binding: FieldBinding; name: string }) => {
  const { invalid, invalidMessage, ...control } = binding;

  return (
    <>
      <input data-testid={name} aria-invalid={invalid} {...control} />
      <span data-testid={`${name}-error`}>{invalidMessage ?? ''}</span>
    </>
  );
};

const TestForm = () => {
  const { field, onSubmit } = useAppForm<Values>({
    schema: Schema,
    t,
    defaultValues: { newPassword: '', confirmPassword: '' },
    onSubmit: () => {},
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field name="newPassword" binding={field('newPassword')} />
      <Field name="confirmPassword" binding={field('confirmPassword')} />
      <button type="submit">Save</button>
    </form>
  );
};

const setup = () => {
  const screen = render(<TestForm />);

  const type = (name: string, value: string) =>
    fireEvent.change(screen.getByTestId(name), { target: { value } });

  const blur = (name: string) => fireEvent.blur(screen.getByTestId(name));

  const errorOf = (name: string) => screen.getByTestId(`${name}-error`).textContent;

  return { ...screen, type, blur, errorOf };
};

describe('useAppForm', () => {
  afterEach(() => cleanup());

  /**
   * The reason the base mode is `onSubmit` rather than RHF's `onTouched`. An
   * autofocused empty field judged on blur sprouts an error the moment the user
   * reaches for a link, and the link moves out from under the click.
   */
  it('stays quiet when an untouched field is passed over', async () => {
    const { blur, errorOf } = setup();

    blur('newPassword');

    await waitFor(() => expect(errorOf('newPassword')).toBe(''));
  });

  it('judges a field on blur once it has been typed in', async () => {
    const { type, blur, errorOf } = setup();

    type('newPassword', 'short');
    blur('newPassword');

    await waitFor(() => expect(errorOf('newPassword')).toBe('validation.tooShort'));
  });

  /** Typing corrects what is already wrong; it never raises something new. */
  it('does not surface a new error while a field is still being typed', async () => {
    const { type, errorOf } = setup();

    type('newPassword', 's');
    type('newPassword', 'sh');

    await waitFor(() => expect(errorOf('newPassword')).toBe(''));
  });

  it('clears an error live once the field is corrected', async () => {
    const { type, blur, errorOf } = setup();

    type('newPassword', 'short');
    blur('newPassword');

    await waitFor(() => expect(errorOf('newPassword')).toBe('validation.tooShort'));

    type('newPassword', 'longenough');

    await waitFor(() => expect(errorOf('newPassword')).toBe(''));
  });

  /**
   * The case the whole change handler is built for: the rule is flagged on
   * `confirmPassword`, but it is `newPassword` being edited, so re-judging only
   * the field that changed would leave the message up while it reads as fixed.
   *
   * This pins the behaviour, not the mechanism. Reading the render snapshot
   * instead of live form state also passes here, because a render lands between
   * the blur and the keystroke - the two only diverge inside a single tick.
   */
  it('clears a cross-field rule from the side that did not carry it', async () => {
    const { type, blur, errorOf } = setup();

    type('newPassword', 'abcdefgh');
    blur('newPassword');
    type('confirmPassword', 'abcdefgx');
    blur('confirmPassword');

    await waitFor(() => expect(errorOf('confirmPassword')).toBe('validation.passwordMismatch'));

    type('newPassword', 'abcdefgx');

    await waitFor(() => expect(errorOf('confirmPassword')).toBe(''));
  });

  it('judges everything on submit, including what was never touched', async () => {
    const { getByText, errorOf } = setup();

    fireEvent.click(getByText('Save'));

    await waitFor(() => {
      expect(errorOf('newPassword')).toBe('validation.tooShort');
      expect(errorOf('confirmPassword')).toBe('validation.required');
    });
  });

  it('marks a flagged control invalid for assistive tech', async () => {
    const { type, blur, getByTestId } = setup();

    type('newPassword', 'short');
    blur('newPassword');

    await waitFor(() => expect(getByTestId('newPassword')).toHaveAttribute('aria-invalid', 'true'));
  });
});
