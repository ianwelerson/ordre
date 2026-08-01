import type { ErrorMap } from '../types/index.ts';

/** Errors for a workspace's locations. */
export const LOCATION_ERRORS = {
  LOCATION_NOT_FOUND: {
    status: 404,
    message: "We couldn't find the location you're looking for",
  },
  LOCATION_CREATE_FAILED: {
    status: 500,
    message: 'Something went wrong while creating the location. Please try again',
  },
  LOCATION_MEMBER_ASSIGN_FAILED: {
    status: 500,
    message: 'Something went wrong while assigning the member to the location. Please try again',
  },
  // 409, not 403: the block is the location's state (it is the default one), not
  // who the caller is - any role hits it.
  LOCATION_IS_DEFAULT: {
    status: 409,
    message: "You can't delete your default location",
  },
} satisfies ErrorMap;
