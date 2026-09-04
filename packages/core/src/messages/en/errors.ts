import type { ErrorCode } from '../../errors/index.ts';

/**
 * User-facing copy for every code in the catalog, keyed by the code itself.
 *
 * No mapping table anywhere: a consumer renders `t(`errors.${error.code}`)` and
 * is done. The code is the key precisely so there is nothing to keep in sync.
 *
 * This is not a duplicate of the `message` in `@ordre/core/errors`. That one is
 * developer-facing - it goes on the wire and into the OpenAPI reference, and for
 * the Better Auth mirror it is kept verbatim so reverse lookups work. This one
 * is what a person reads.
 *
 * Typed as `Record<ErrorCode, string>`: adding a code in core breaks this file,
 * in every locale, until someone writes words for it.
 */
export const errors: Record<ErrorCode, string> = {
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'Your session has ended. Sign in again.',
  FORBIDDEN: "You don't have permission to do that.",
  USER_NOT_FOUND: "We couldn't find an account with those details.",
  FAILED_TO_CREATE_USER: "We couldn't create your account. Please try again.",
  FAILED_TO_UPDATE_USER: "We couldn't save your changes. Please try again.",
  INVALID_USER: "We couldn't verify your account.",
  USER_EMAIL_NOT_FOUND: "We couldn't find an account with that email.",
  USER_ALREADY_EXISTS: 'An account with that email already exists.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'An account with that email already exists. Try another one.',
  USER_ALREADY_HAS_PASSWORD: 'Your account already has a password. Enter it to continue.',
  ACCOUNT_NOT_FOUND: "We couldn't find that account.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "We couldn't find an account with a password set.",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "You can't unlink your last sign-in method.",
  LINKED_ACCOUNT_ALREADY_EXISTS: 'That account is already linked.',
  SOCIAL_ACCOUNT_ALREADY_LINKED: 'That account is already linked to another user.',
  FAILED_TO_CREATE_SESSION: "We couldn't sign you in. Please try again.",
  FAILED_TO_GET_SESSION: "We couldn't verify your session. Sign in again.",
  SESSION_EXPIRED: 'Your session has expired. Sign in again.',
  SESSION_NOT_FRESH: 'Confirm your password to continue.',
  INVALID_PASSWORD: "That password isn't correct.",
  INVALID_EMAIL: 'Enter a valid email address.',
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  PASSWORD_TOO_SHORT: 'That password is too short.',
  PASSWORD_TOO_LONG: 'That password is too long.',
  PASSWORD_ALREADY_SET: 'Your account already has a password set.',
  EMAIL_NOT_VERIFIED: 'Verify your email address before continuing.',
  EMAIL_CAN_NOT_BE_UPDATED: "That email address can't be changed.",
  CHANGE_EMAIL_DISABLED: "Changing your email address isn't available.",
  EMAIL_ALREADY_VERIFIED: 'That email address is already verified.',
  EMAIL_MISMATCH: "That email address doesn't match.",
  VERIFICATION_EMAIL_NOT_ENABLED: "Email verification isn't available.",
  FAILED_TO_CREATE_VERIFICATION: "We couldn't send the verification email. Please try again.",
  PROVIDER_NOT_FOUND: "That sign-in method isn't available.",
  INVALID_TOKEN: "This link isn't valid. Request a new one.",
  TOKEN_EXPIRED: 'This link has expired. Request a new one.',
  ID_TOKEN_NOT_SUPPORTED: "That sign-in method isn't supported.",
  FAILED_TO_GET_USER_INFO: "We couldn't read your profile from that provider.",
  INVALID_ORIGIN: "This request came from an address we don't recognise.",
  MISSING_OR_NULL_ORIGIN: "This request came from an address we don't recognise.",
  INVALID_CALLBACK_URL: "That return address isn't allowed.",
  INVALID_REDIRECT_URL: "That return address isn't allowed.",
  INVALID_ERROR_CALLBACK_URL: "That return address isn't allowed.",
  INVALID_NEW_USER_CALLBACK_URL: "That return address isn't allowed.",
  CALLBACK_URL_REQUIRED: 'A return address is required.',
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
    'For your security, this sign-in was blocked. Try again from the sign-in page.',
  METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED: 'Something went wrong. Please try again.',
  INVALID_INPUT: "Some of the information you entered isn't valid.",
  VALIDATION_ERROR: "Some of the information you entered isn't valid.",
  MISSING_FIELD: 'This field is required.',
  FIELD_NOT_ALLOWED: "This field can't be set.",
  BODY_MUST_BE_AN_OBJECT: 'Something went wrong. Please try again.',
  ASYNC_VALIDATION_NOT_SUPPORTED: 'Something went wrong. Please try again.',
  WORKSPACE_NOT_FOUND: "We couldn't find the workspace you're looking for.",
  WORKSPACE_CREATE_FAILED: 'Something went wrong while creating your workspace. Please try again.',
  WORKSPACE_SLUG_ALREADY_EXISTS: 'That workspace name is already taken.',
  WORKSPACE_SLUG_RESERVED: 'This name is reserved. Please choose another.',
  WORKSPACE_SLUG_PROTECTED:
    'This name is reserved. If it belongs to your organization, get in contact with us.',
  WORKSPACE_SLUG_BANNED: "This name isn't available. Please choose another.",
  LOCATION_NOT_FOUND: "We couldn't find the location you're looking for.",
  LOCATION_CREATE_FAILED: 'Something went wrong while creating the location. Please try again.',
  LOCATION_MEMBER_ASSIGN_FAILED:
    'Something went wrong while assigning the member to the location. Please try again.',
  LOCATION_IS_DEFAULT: "You can't delete your default location.",
  MEMBER_NOT_FOUND: "We couldn't find the member you're looking for.",
  MEMBER_ALREADY_EXISTS: 'A member with this email already exists in the workspace.',
  MEMBER_LAST_OWNER: 'A workspace needs at least one owner. Assign another owner first.',
  MEMBER_TARGET_SUSPENDED: "You can't change the role for a suspended member.",
  MEMBER_SELF_SUSPENDED: 'Your access to this workspace has been suspended.',
  MEMBER_SELF_ROLE_UPDATE: "You can't change your own role.",
  MEMBER_SELF_REMOVE: "You can't remove yourself from the workspace.",
  MEMBER_OWNER_ROLE_FORBIDDEN: 'Only an owner can assign or change the owner role.',
  MEMBER_REMOVE_FORBIDDEN: 'You can only remove members, not owners or admins.',
  INVITE_NOT_FOUND: "We couldn't find the invite you're looking for.",
  INVITE_CREATE_FAILED: 'Something went wrong while creating the invite. Please try again.',
  INVITE_ALREADY_PENDING: 'There is already a pending invite for this email.',
  INVITE_EMAIL_MISMATCH: 'This invite was sent to a different email address.',
  PLAN_MISSING: "We couldn't find an active plan for this workspace. Please contact support.",
  PLAN_ENTITLEMENTS_INVALID: "We couldn't read the limits on your plan. Please contact support.",
  PLAN_LOCATION_LIMIT_REACHED:
    "You've reached the maximum number of locations allowed on your plan.",
  PLAN_SEAT_LIMIT_REACHED: "You've used every seat on your plan. Pending invites count as seats.",
  NETWORK_ERROR: "We couldn't reach the server. Check your connection and try again.",
  MALFORMED_RESPONSE: 'We got an unexpected response from the server. Please try again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  FEATURE_LOGIN_DISABLED: "Signing in isn't available right now. Check back soon.",
  FEATURE_REGISTRATION_DISABLED: "New accounts aren't open right now. Check back soon.",
  FEATURE_WORKSPACE_CREATION_DISABLED: "New workspaces aren't open right now. Check back soon.",
  FEATURE_WORKSPACE_LOCATION_DISABLED:
    "Adding locations isn't available right now. Check back soon.",
  FEATURE_WORKSPACE_INVITE_DISABLED: "Sending invites isn't available right now. Check back soon.",
};
