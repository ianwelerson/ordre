import { getPgError, isUniqueViolation, PG_ERROR_CODES } from './db-error.ts';

describe('utils/db-error', () => {
  describe('getPgError', () => {
    it('returns the error when it has a string code', () => {
      const error = { code: PG_ERROR_CODES.UNIQUE_VIOLATION, constraint: 'workspace_slug_unique' };

      const result = getPgError(error);

      expect(result).toBe(error);
    });

    it('unwraps a pg error from the .cause (Drizzle wrapping)', () => {
      const cause = { code: PG_ERROR_CODES.FOREIGN_KEY_VIOLATION };
      const error = new Error('insert failed');
      (error as Error & { cause: unknown }).cause = cause;

      const result = getPgError(error);

      expect(result).toBe(cause);
    });

    it('prefers the error itself over its .cause when both have a code', () => {
      const cause = { code: PG_ERROR_CODES.FOREIGN_KEY_VIOLATION };
      const error = { code: PG_ERROR_CODES.UNIQUE_VIOLATION, cause };

      const result = getPgError(error);

      expect(result).toBe(error);
    });

    it('returns null for an error without a code', () => {
      const result = getPgError(new Error('boom'));

      expect(result).toBeNull();
    });

    it('returns null when the code is not a string', () => {
      const result = getPgError({ code: 23505 });

      expect(result).toBeNull();
    });

    it('returns null when the .cause is not a pg error', () => {
      const error = { cause: { detail: 'no code here' } };

      const result = getPgError(error);

      expect(result).toBeNull();
    });

    it('returns null for null', () => {
      expect(getPgError(null)).toBeNull();
    });

    it('returns null for primitives', () => {
      expect(getPgError('23505')).toBeNull();
      expect(getPgError(undefined)).toBeNull();
    });
  });

  describe('isUniqueViolation', () => {
    it('returns true for a unique violation', () => {
      const error = { code: PG_ERROR_CODES.UNIQUE_VIOLATION };

      expect(isUniqueViolation(error)).toBe(true);
    });

    it('returns true when the wrapped .cause is a unique violation', () => {
      const error = { cause: { code: PG_ERROR_CODES.UNIQUE_VIOLATION } };

      expect(isUniqueViolation(error)).toBe(true);
    });

    it('returns false for a different pg error code', () => {
      const error = { code: PG_ERROR_CODES.CHECK_VIOLATION };

      expect(isUniqueViolation(error)).toBe(false);
    });

    it('returns false for a non-pg error', () => {
      expect(isUniqueViolation(new Error('boom'))).toBe(false);
    });

    describe('with a constraint argument', () => {
      it('returns true when the constraint matches', () => {
        const error = {
          code: PG_ERROR_CODES.UNIQUE_VIOLATION,
          constraint: 'workspace_slug_unique',
        };

        expect(isUniqueViolation(error, 'workspace_slug_unique')).toBe(true);
      });

      it('returns false when the constraint does not match', () => {
        const error = {
          code: PG_ERROR_CODES.UNIQUE_VIOLATION,
          constraint: 'workspace_slug_unique',
        };

        expect(isUniqueViolation(error, 'other_unique')).toBe(false);
      });

      it('returns false when the error has no constraint', () => {
        const error = { code: PG_ERROR_CODES.UNIQUE_VIOLATION };

        expect(isUniqueViolation(error, 'workspace_slug_unique')).toBe(false);
      });
    });
  });
});
