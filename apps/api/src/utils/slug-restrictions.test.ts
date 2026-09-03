import { getSlugRestriction } from './slug-restrictions.ts';

describe('utils/slug-restriction', () => {
  describe('getSlugRestriction', () => {
    it('returns null for an unrestricted slug', () => {
      const result = getSlugRestriction('valid-slug');

      expect(result).toBeNull();
    });

    it('classifies a known brand as WORKSPACE_SLUG_PROTECTED', () => {
      const result = getSlugRestriction('coca-cola');

      expect(result).toBe('WORKSPACE_SLUG_PROTECTED');
    });

    it('classifies a platform/system name as WORKSPACE_SLUG_RESERVED', () => {
      const result = getSlugRestriction('admin');

      expect(result).toBe('WORKSPACE_SLUG_RESERVED');
    });

    describe('Banned slugs', () => {
      it('classifies profanity as WORKSPACE_SLUG_BANNED', () => {
        const result = getSlugRestriction('fuck');

        expect(result).toBe('WORKSPACE_SLUG_BANNED');
      });

      it('classifies separator-smuggled profanity as WORKSPACE_SLUG_BANNED after normalization', () => {
        const result = getSlugRestriction('b1tch');

        expect(result).toBe('WORKSPACE_SLUG_BANNED');
      });
    });
  });
});
