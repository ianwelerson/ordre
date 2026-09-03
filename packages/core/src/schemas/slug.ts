import { z } from 'zod';

/**
 * Rewrites text into slug form: lowercase, hyphen-separated, ASCII.
 *
 * Succeeds on every string, returning an empty one when nothing survives, so
 * input that has to be rejected is parsed against {@link SlugSchema} instead.
 * `normalize('NFD')` splits an accented character into its base letter plus a
 * combining mark, which is what lets the slugify keep the letter and drop only
 * the mark.
 */
export const SlugTransformSchema = z.string().normalize('NFD').slugify();

/** A slug that can be stored. Text that slugifies to nothing is rejected. */
export const SlugSchema = SlugTransformSchema.min(1, 'validation.slugEmpty');
