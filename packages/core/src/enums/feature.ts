/**
 * The switches that can close a surface without a deploy.
 *
 * This list decides which keys mean anything. The `feature` table stores an
 * override per key, and a row whose key is missing here is ignored on read.
 */
export const FEATURES = [
  // Account
  'login',
  'registration',
  // Workspace
  'workspace-creation',
  'workspace-location',
  'workspace-invite',
] as const;
export type Feature = (typeof FEATURES)[number];

/**
 * The value a feature takes when the database holds no row for it, or cannot be
 * read at all. Every surface starts closed, so an absent row and an unreachable
 * database resolve to the same safe answer.
 */
export const FEATURE_DEFAULTS: Record<Feature, boolean> = {
  login: false,
  registration: false,
  'workspace-creation': false,
  'workspace-invite': false,
  'workspace-location': false,
};
