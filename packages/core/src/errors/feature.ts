import type { Feature } from '../enums/feature.ts';
import type { ErrorMap } from '../types/index.ts';

/**
 * Errors returned while a surface is switched off.
 */
export const FEATURE_ERRORS = {
  FEATURE_LOGIN_DISABLED: { status: 403 },
  FEATURE_REGISTRATION_DISABLED: { status: 403 },
  FEATURE_WORKSPACE_CREATION_DISABLED: { status: 403 },
  FEATURE_WORKSPACE_LOCATION_DISABLED: { status: 403 },
  FEATURE_WORKSPACE_INVITE_DISABLED: { status: 403 },
} satisfies ErrorMap;

/** The code each feature is refused with. */
export const FEATURE_DISABLED = {
  login: 'FEATURE_LOGIN_DISABLED',
  registration: 'FEATURE_REGISTRATION_DISABLED',
  'workspace-creation': 'FEATURE_WORKSPACE_CREATION_DISABLED',
  'workspace-location': 'FEATURE_WORKSPACE_LOCATION_DISABLED',
  'workspace-invite': 'FEATURE_WORKSPACE_INVITE_DISABLED',
} satisfies Record<Feature, keyof typeof FEATURE_ERRORS>;
