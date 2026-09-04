import { db } from '#/config/db.ts';
import { logger } from '#/config/logger.ts';

import { type Feature, FEATURE_DEFAULTS, FEATURES } from '@ordre/core/enums';
import type { Features } from '@ordre/core/types';
import { feature } from '@ordre/db/schemas';

/** How long a resolved set is reused before the table is read again. */
const CACHE_TTL_MS = 30_000;

/**
 * How long a failed read is reused before the table is tried again.
 *
 * Shorter than `CACHE_TTL_MS`, so a switch lands promptly once the database
 * recovers.
 */
const FAILURE_TTL_MS = 2_000;

/**
 * Reads the overrides stored in the `feature` table.
 *
 * A key with no row keeps its `FEATURE_DEFAULTS` value, so the table only has to
 * carry what differs. The read goes through the pooled `db` because the table is
 * global configuration with no row-level security to scope it by.
 */
const readOverrides = async (): Promise<Partial<Record<Feature, boolean>>> => {
  const rows = await db.select({ key: feature.key, enabled: feature.enabled }).from(feature);

  const known = new Set<string>(FEATURES);
  const overrides: Partial<Record<Feature, boolean>> = {};

  for (const row of rows) {
    // A key absent from `FEATURES` describes nothing this build can gate on.
    if (known.has(row.key)) {
      overrides[row.key as Feature] = row.enabled;
    }
  }

  return overrides;
};

let cache: { value: Features; expiresAt: number } | null = null;
let inFlight: Promise<Features> | null = null;

/** Drops the cached set, so the next read goes back to the table. */
export const clearFeatureCache = (): void => {
  cache = null;
  inFlight = null;
};

/**
 * Reads the table once and caches what it answers.
 *
 * A failure is cached too, for the shorter `FAILURE_TTL_MS`, so a database that
 * is down costs one read every couple of seconds.
 */
const resolve = async (): Promise<Features> => {
  try {
    const overrides = await readOverrides();

    // Built from `FEATURES` so the result covers every key exactly once, whatever
    // the table held.
    const value = Object.fromEntries(
      FEATURES.map((key) => [key, overrides[key] ?? FEATURE_DEFAULTS[key]])
    ) as Features;

    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };

    return value;
  } catch (error) {
    logger.error({ err: error, event: 'feature.read_failed' }, 'failed to read feature switches');

    const value = { ...FEATURE_DEFAULTS };

    cache = { value, expiresAt: Date.now() + FAILURE_TTL_MS };

    return value;
  } finally {
    inFlight = null;
  }
};

/**
 * Every feature and whether it is on, with the table's overrides applied over
 * `FEATURE_DEFAULTS`.
 *
 * The result is cached in-process for `CACHE_TTL_MS`, so a switch takes up to that
 * long to reach a running instance. Callers that arrive while a read is already
 * running wait on that read, so a cold cache costs one query however many requests
 * land on it at once.
 */
export const getFeatures = async (): Promise<Features> => {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  inFlight ??= resolve();

  return inFlight;
};

/**
 * Whether one feature is on.
 *
 * @example
 * const open = await isFeatureEnabled('workspace-creation');
 */
export const isFeatureEnabled = async (key: Feature): Promise<boolean> => {
  return (await getFeatures())[key];
};
