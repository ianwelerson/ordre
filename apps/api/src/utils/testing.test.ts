import { z } from 'zod';

import { parseBody } from './testing.ts';

describe('utils/testing', () => {
  describe('parseBody', () => {
    it('returns the parsed body typed as the schema output', () => {
      const schema = z.object({ id: z.string(), count: z.number() });
      const body = { id: 'abc', count: 3 };

      const result = parseBody(schema, body);

      expect(result).toEqual(body);
    });

    it('strips unknown keys according to the schema', () => {
      const schema = z.object({ id: z.string() });

      const result = parseBody(schema, { id: 'abc', extra: 'nope' });

      expect(result).toEqual({ id: 'abc' });
    });

    it('applies schema transforms to the returned value', () => {
      const schema = z.object({ count: z.coerce.number() });

      const result = parseBody(schema, { count: '42' });

      expect(result).toEqual({ count: 42 });
    });

    it('throws when the body does not match the schema', () => {
      const schema = z.object({ id: z.string() });

      expect(() => parseBody(schema, { id: 123 })).toThrow(/Response body did not match schema/);
    });

    it('includes the received body in the error message', () => {
      const schema = z.object({ id: z.string() });

      expect(() => parseBody(schema, { id: 123 })).toThrow(/Received:/);
    });
  });
});
