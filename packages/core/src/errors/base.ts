import type { ErrorMap } from '../types/index.ts';

export const BASE_ERRORS = {
  SOMETHING_WRONG: {
    status: 500,
    message: 'Something went wrong. Please try again',
  },
} satisfies ErrorMap;
