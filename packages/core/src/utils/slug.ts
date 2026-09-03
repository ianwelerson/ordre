import { SlugTransformSchema } from '../schemas/slug.ts';

/**
 * Returns the slug form of the text, or an empty string when nothing survives
 * the transform.
 *
 * @example
 * slugify('Açaí Manutenção'); // 'acai-manutencao'
 */
export const slugify = (text: string): string => SlugTransformSchema.parse(text);
