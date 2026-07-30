import { z } from 'zod';

import {
  parseBetterAuthValidationDetails,
  validateField,
  validateRequestBody,
} from './validation.ts';

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

  describe('validateRequestBody', () => {
    const schema = z.object({ name: z.string() });

    it('should return the parsed data on success', () => {
      const result = validateRequestBody(schema, { name: 'ordre' });

      expect(result).toEqual({ success: true, data: { name: 'ordre' } });
    });

    it('should return an INVALID_INPUT response with per-field details on a ZodError', () => {
      const result = validateRequestBody(schema, { name: 123 });

      expect(result).toMatchObject({
        success: false,
        response: {
          status: 400,
          body: {
            code: 'INVALID_INPUT',
            details: { name: expect.any(String) },
          },
        },
      });
    });

    it('should rethrow a non-Zod error', () => {
      const boom = new Error('not a zod error');
      const throwingSchema = {
        parse: () => {
          throw boom;
        },
      } as unknown as z.ZodType<{ name: string }>;

      expect(() => validateRequestBody(throwingSchema, {})).toThrow(boom);
    });
  });

  describe('validateField', () => {
    it('should return the parsed value on success', () => {
      const result = validateField(z.uuid(), '00000000-0000-0000-0000-000000000000', 'id');

      expect(result).toEqual({
        success: true,
        data: '00000000-0000-0000-0000-000000000000',
      });
    });

    it('should return an INVALID_INPUT response keyed by the field name on failure', () => {
      const result = validateField(z.uuid(), 'not-a-uuid', 'id');

      expect(result).toMatchObject({
        success: false,
        response: {
          status: 400,
          body: {
            code: 'INVALID_INPUT',
            details: { id: expect.any(String) },
          },
        },
      });
    });
  });
});
