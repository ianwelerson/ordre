/**
 * Notices the login page can be arrived at with, so that
 * `/login?notice=password-reset` renders a confirmation banner above the form.
 *
 * These stay in the app rather than in `@ordre/core/constants`, because nothing
 * outside the dashboard links here with one.
 */
export const LOGIN_NOTICE_PARAM = 'notice';

export const LOGIN_NOTICE = {
  passwordReset: 'password-reset',
  accountExists: 'account-exists',
} as const;

export type LoginNotice = (typeof LOGIN_NOTICE)[keyof typeof LOGIN_NOTICE];
