/**
 * The set-password page is generic - a password reset and an invite's first
 * password both land there - so the arriving link carries a `source` query
 * param that picks the page's copy.
 */
export const SET_PASSWORD_SOURCE_PARAM = 'source';

export const SET_PASSWORD_SOURCE = {
  forgotPassword: 'forgot-password',
  createPassword: 'create-password',
} as const;

export type SetPasswordSource = (typeof SET_PASSWORD_SOURCE)[keyof typeof SET_PASSWORD_SOURCE];

/**
 * Notices the login page can be arrived at with - `/login?notice=password-reset`
 * renders a confirmation banner above the form. Values are validated on read,
 * so an edited query string renders nothing rather than a broken key.
 */
export const LOGIN_NOTICE_PARAM = 'notice';

export const LOGIN_NOTICE = {
  passwordReset: 'password-reset',
} as const;

export type LoginNotice = (typeof LOGIN_NOTICE)[keyof typeof LOGIN_NOTICE];
