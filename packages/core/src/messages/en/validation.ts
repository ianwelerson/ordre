import type { ValidationKey } from '../../schemas/index.ts';

/**
 * Copy for every key the shared Zod error map produces (see
 * `error-map.ts` in `@ordre/core/schemas`). Schemas carry no messages of their
 * own, so this is where a validation failure gets its words - in the browser for
 * a form, and in the OpenAPI reference for the published spec.
 *
 * Typed as `Record<ValidationKey, string>`: adding a key in core breaks this
 * file, in every locale, until someone translates it.
 *
 * Keys carry no parameters, so `tooShort` cannot say "at least 8 characters". A
 * rule that needs the number passes its own key - `z.string().min(8,
 * 'validation.passwordTooShort')` - and adds it below.
 */
export const validation: Record<ValidationKey, string> = {
  required: 'This field is required.',
  invalidType: "This value isn't in the expected format.",
  invalidFormat: "This value isn't in the expected format.",
  invalid: "This value isn't valid.",
  email: 'Enter a valid email address.',
  url: 'Enter a valid URL.',
  uuid: 'Enter a valid identifier.',
  datetime: 'Enter a valid date and time.',
  date: 'Enter a valid date.',
  time: 'Enter a valid time.',
  ipv4: 'Enter a valid IPv4 address.',
  ipv6: 'Enter a valid IPv6 address.',
  regex: "This value isn't in the expected format.",
  tooShort: 'This value is too short.',
  tooLong: 'This value is too long.',
  invalidOption: 'Choose one of the available options.',
  invalidNumber: 'Enter a valid number.',
  unknownField: "This field isn't recognised.",
  passwordMismatch: "The passwords don't match.",
};
