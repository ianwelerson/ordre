import { describe, expect, it } from 'vitest';

import { SignUpFormSchema } from './schema';

describe('schema.ts', () => {
  it('should accept both name parts and a password with no email', () => {
    const result = SignUpFormSchema.safeParse({
      firstName: 'Lucas',
      lastName: 'Marino',
      password: 'a-good-secret',
      productNewsOptIn: false,
    });

    expect(result.success).toBe(true);
  });

  /**
   * The invite fixes the address, so a submitted email would be a second source
   * for it. Omitting the field is what keeps the form from carrying one.
   */
  it('should drop an email it was handed', () => {
    const result = SignUpFormSchema.parse({
      firstName: 'Lucas',
      lastName: 'Marino',
      password: 'a-good-secret',
      productNewsOptIn: false,
      email: 'someone@else.app',
    });

    expect(result).not.toHaveProperty('email');
  });

  it('should keep the password rule it inherited', () => {
    const result = SignUpFormSchema.safeParse({
      firstName: 'Lucas',
      lastName: 'Marino',
      password: 'short',
      productNewsOptIn: false,
    });

    expect(result.success).toBe(false);
  });
});
