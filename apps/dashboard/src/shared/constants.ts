/**
 * Notices the login page can be arrived at with - `/login?notice=password-reset`
 * renders a confirmation banner above the form. Values are validated on read,
 * so an edited query string renders nothing rather than a broken key.
 *
 * Unlike the set-password source in `@ordre/core/constants`, these never leave
 * the app: nothing outside it links here with one, so there is nothing to agree
 * with.
 */
export const LOGIN_NOTICE_PARAM = 'notice';

export const LOGIN_NOTICE = {
  passwordReset: 'password-reset',
  accountExists: 'account-exists',
} as const;

export type LoginNotice = (typeof LOGIN_NOTICE)[keyof typeof LOGIN_NOTICE];
