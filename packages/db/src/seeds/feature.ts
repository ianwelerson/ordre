import { type Feature, FEATURES } from '@ordre/core/enums';

import type { Db } from '../connection.ts';
import { feature } from '../schemas/feature.ts';

/**
 * What each switch closes, and the state it is created in.
 *
 * Every switch starts off, so a fresh database serves none of these surfaces
 * until someone opens them deliberately. The description is what an operator
 * reads before flipping one, so it names what stays working too.
 */
const FEATURE_CATALOG: Record<Feature, { enabled: boolean; description: string }> = {
  login: {
    enabled: false,
    description: 'Signing in. Sessions that are already live keep working.',
  },
  registration: {
    enabled: false,
    description: 'Creating an account through sign-up.',
  },
  'workspace-creation': {
    enabled: false,
    description: 'Creating a workspace, including the first one a new account creates.',
  },
  'workspace-location': {
    enabled: false,
    description: 'Adding a location to a workspace. Editing existing ones keeps working.',
  },
  'workspace-invite': {
    enabled: false,
    description: 'Sending a workspace invite. Accepting an outstanding one keeps working.',
  },
};

/**
 * Inserts a row for every feature that has none yet.
 *
 * A switch that already has a row keeps the state it is in, so re-seeding never
 * closes a surface that someone has opened.
 */
export const seedFeatures = async (db: Db): Promise<void> => {
  await db
    .insert(feature)
    .values(FEATURES.map((key) => ({ key, ...FEATURE_CATALOG[key] })))
    .onConflictDoNothing({ target: feature.key });
};
