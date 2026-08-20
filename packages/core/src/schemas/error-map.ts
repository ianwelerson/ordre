import { z } from 'zod';

/**
 * Turns every Zod failure into a stable translation key instead of an English
 * sentence.
 *
 * The problem this solves: a schema is parsed in three places that need three
 * different renderings of the same failure - the browser (the user's locale),
 * the API (which puts it in `details` for a client to translate), and the
 * OpenAPI reference (English prose). Baking a message into the schema picks one
 * of those and leaves the others wrong.
 *
 * So schemas carry no messages at all. `z.email()` stays `z.email()`, and this
 * map derives the key from the issue. Copy for every key lives in
 * `@ordre/core/messages`, and the OpenAPI generator resolves them back to English
 * for the published spec.
 *
 * Installed globally, from `schemas/index.ts` - importing any schema in this
 * package installs it, and a schema cannot be used without that import.
 *
 * ## Overriding
 *
 * This is the default, not a ceiling. A rule whose generic wording is not good
 * enough passes its own key, and that wins:
 *
 * ```ts
 * z.string().min(8, 'validation.passwordTooShort')
 * ```
 *
 * ## Known limitation
 *
 * Keys carry no parameters, so `too_small` renders as "this is too short" rather
 * than "at least 8 characters". Interpolation would mean `details` carrying
 * objects instead of strings.
 */
const VALIDATION_KEY_PREFIX = 'validation';

/**
 * Every key this map can produce.
 *
 * Declared as a list rather than inferred from the switch below so the messages
 * can type its copy as `Record<ValidationKey, string>` - which is what makes a
 * new key fail the build until every locale has words for it.
 */
export const VALIDATION_KEYS = [
  'required',
  'invalidType',
  'invalidFormat',
  'invalid',
  'email',
  'url',
  'uuid',
  'datetime',
  'date',
  'time',
  'ipv4',
  'ipv6',
  'regex',
  'tooShort',
  'tooLong',
  'invalidOption',
  'invalidNumber',
  'unknownField',
  'passwordMismatch',
] as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[number];

/** Formats we have specific copy for. Anything else falls back to the generic key. */
const KNOWN_FORMATS = new Set<string>([
  'email',
  'url',
  'uuid',
  'datetime',
  'date',
  'time',
  'ipv4',
  'ipv6',
  'regex',
]);

const key = (name: ValidationKey) => `${VALIDATION_KEY_PREFIX}.${name}`;

/**
 * Maps one Zod issue to a key.
 *
 * Exported for the unit tests, which assert the mapping directly rather than
 * through a schema - there are more issue shapes than there are schemas worth
 * writing to reach them.
 */
export const validationKeyFor = (issue: z.core.$ZodRawIssue): string => {
  switch (issue.code) {
    // A missing field and a wrongly-typed one are the same issue code, told
    // apart by whether anything arrived at all. They read very differently to a
    // user, so they get different copy.
    case 'invalid_type':
      return issue.input === undefined ? key('required') : key('invalidType');

    case 'invalid_format': {
      const format = 'format' in issue ? String(issue.format) : '';

      return KNOWN_FORMATS.has(format) ? key(format as ValidationKey) : key('invalidFormat');
    }

    // `min(1)` on a string is how "required" is spelled for a value that is
    // present but empty, so it resolves to the same copy as a missing one.
    case 'too_small':
      return issue.origin === 'string' && Number(issue.minimum) <= 1
        ? key('required')
        : key('tooShort');

    case 'too_big':
      return key('tooLong');

    case 'invalid_value':
      return key('invalidOption');

    case 'not_multiple_of':
      return key('invalidNumber');

    case 'unrecognized_keys':
      return key('unknownField');

    default:
      return key('invalid');
  }
};

/**
 * Installs the map globally. Called once, at import of `@ordre/core/schemas`.
 */
export const installValidationErrorMap = (): void => {
  z.config({ customError: validationKeyFor });
};
