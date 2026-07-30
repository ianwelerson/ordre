import { getSlugRestriction } from './slug-restrictions.ts';

describe('utils/slug-restriction', () => {
  describe('getSlugRestriction', () => {
    it('returns null for an unrestricted slug', () => {
      const result = getSlugRestriction('valid-slug');

      expect(result).toBeNull();
    });

    it('classifies a known brand as PROTECTED', () => {
      const result = getSlugRestriction('coca-cola');

      expect(result).toBe('PROTECTED');
    });

    it('classifies a platform/system name as RESERVED', () => {
      const result = getSlugRestriction('admin');

      expect(result).toBe('RESERVED');
    });

    describe('Banned slugs', () => {
      it('classifies profanity as BANNED', () => {
        const result = getSlugRestriction('fuck');

        expect(result).toBe('BANNED');
      });

      it('classifies separator-smuggled profanity as BANNED after normalization', () => {
        const result = getSlugRestriction('b1tch');

        expect(result).toBe('BANNED');
      });
    });
  });
});
