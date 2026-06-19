import { envSchema } from './env.ts';

describe('config/env', () => {
  describe('envSchema', () => {
    const validEnv = {
      NODE_ENV: 'production',
      APP_STAGE: 'production',
      PORT: '8080',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    };

    it('should parse a valid environment and coerce PORT to a number', () => {
      const result = envSchema.safeParse(validEnv);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        NODE_ENV: 'production',
        APP_STAGE: 'production',
        PORT: 8080,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      });
    });

    it('should apply defaults when optional vars are omitted', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://localhost/db',
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        NODE_ENV: 'development',
        APP_STAGE: 'development',
        PORT: 3000,
      });
    });

    it('should fail when NODE_ENV and APP_STAGE do not match', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'production',
        APP_STAGE: 'development',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path.includes('APP_STAGE'))).toBe(true);
    });

    it('should fail when DATABASE_URL is not a postgresql:// url', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        DATABASE_URL: 'mysql://localhost/db',
      });

      expect(result.success).toBe(false);
    });

    it('should fail when DATABASE_URL is missing', () => {
      const { DATABASE_URL: _omitted, ...withoutDbUrl } = validEnv;
      const result = envSchema.safeParse(withoutDbUrl);

      expect(result.success).toBe(false);
    });

    it('should fail when PORT is not a positive number', () => {
      const result = envSchema.safeParse({ ...validEnv, PORT: '-1' });

      expect(result.success).toBe(false);
    });
  });
});
