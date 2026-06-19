import { parseBetterAuthValidationDetails } from './validation.ts';

describe('utils/validation', () => {
  describe('parseBetterAuthValidationDetails', () => {
    it('should map each semicolon-separated error to its field name', () => {
      const result = parseBetterAuthValidationDetails(
        '[body.email] Invalid input; [body.password] Invalid input'
      );

      expect(result).toMatchObject({
        email: 'Invalid input',
        password: 'Invalid input',
      });
    });

    it('should map a single error with a trailing semicolon to its field name', () => {
      const result = parseBetterAuthValidationDetails('[body.email] Invalid input;');

      expect(result).toMatchObject({
        email: 'Invalid input',
      });
    });

    it('should return an empty object for an empty string', () => {
      const result = parseBetterAuthValidationDetails('');

      expect(result).toMatchObject({});
    });

    it('should return an empty object for a non-string value', () => {
      // @ts-expect-error forcing undefined
      const result = parseBetterAuthValidationDetails(undefined);

      expect(result).toMatchObject({});
    });
  });
});
