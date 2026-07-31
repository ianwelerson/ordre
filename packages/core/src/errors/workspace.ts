import type { ErrorMap } from '../types/index.ts';

export const WORKSPACE_ERRORS = {
  SLUG_ALREADY_EXISTS: {
    status: 409,
    message: 'The slug already exists',
  },
  CREATING_ERROR: {
    status: 500,
    message: 'Something went wrong while creating your workspace. Please try again',
  },
  UPDATING_ERROR: {
    status: 500,
    message: 'Something went wrong while updating the workspace. Please try again',
  },
  NOT_FOUND: {
    status: 404,
    message: "We couldn't find the workspace you're looking for",
  },
  LOCATION_NOT_FOUND: {
    status: 404,
    message: "We couldn't find the location you're looking for",
  },
  LOCATION_CREATING_ERROR: {
    status: 500,
    message: 'Something went wrong while creating the location. Please try again',
  },
  LOCATION_UPDATING_ERROR: {
    status: 500,
    message: 'Something went wrong while updating the location. Please try again',
  },
  LOCATION_MEMBER_ASSIGN: {
    status: 500,
    message: 'Something went wrong while assigning the member to the location. Please try again',
  },
  CANNOT_DELETE_DEFAULT_LOCATION: {
    status: 409,
    message: "You can't delete your default location",
  },
  INVITE_CREATING_ERROR: {
    status: 500,
    message: 'Something went wrong while creating the invite. Please try again',
  },
  MEMBER_ALREADY_EXISTS: {
    status: 409,
    message: 'A member with this email already exists in the workspace',
  },
  MEMBER_NOT_FOUND: {
    status: 404,
    message: "We couldn't find the member you're looking for",
  },
  MEMBER_SELF_ROLE_UPDATE: {
    status: 409,
    message: "You can't change your own role",
  },
  MEMBER_SELF_REMOVE: {
    status: 409,
    message: "You can't remove yourself from the workspace",
  },
  MEMBER_OWNER_ROLE_FORBIDDEN: {
    status: 409,
    message: 'Only an owner can assign or change the owner role',
  },
  MEMBER_REMOVE_FORBIDDEN: {
    status: 409,
    message: 'You can only remove members, not owners or admins',
  },
  MEMBER_LAST_OWNER: {
    status: 409,
    message: 'A workspace must always have at least one owner',
  },
  MEMBER_SUSPENDED: {
    status: 409,
    message: "You can't change the role for a suspended member",
  },
  MEMBER_ACCESS_SUSPENDED: {
    status: 403,
    message: 'Your access to this workspace has been suspended',
  },
  INVITE_ALREADY_PENDING: {
    status: 409,
    message: 'There is already a pending invite for this email',
  },
  INVITE_NOT_FOUND: {
    status: 404,
    message: "We couldn't find the invite you're looking for",
  },
  INVITE_EMAIL_MISMATCH: {
    status: 403,
    message: 'This invite was sent to a different email address',
  },
  INVITE_EXPIRED: {
    status: 410,
    message: 'This invite has expired. Please request a new one',
  },
  RESERVED_SLUG: { status: 400, message: 'This name is reserved. Please choose another.' },
  PROTECTED_SLUG: {
    status: 400,
    message: 'This name is reserved. If it belongs to your organization, get in contact with us.',
  },
  BANNED_SLUG: { status: 400, message: "This name isn't available. Please choose another." },
} satisfies ErrorMap;
