import { envSchema } from './env.ts';

describe('config/env', () => {
  describe('envSchema', () => {
    const validEnv = {
      NODE_ENV: 'production',
      APP_STAGE: 'production',
      PORT: '8080',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      DATABASE_OWNER_URL: 'postgresql://owner:pass@localhost:5432/db',
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
        DATABASE_OWNER_URL: 'postgresql://localhost/db',
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        NODE_ENV: 'development',
        APP_STAGE: 'development',
        PORT: 3000,
      });
    });

    it.each(['staging', 'production'])(
      'should fail when APP_STAGE is %s without NODE_ENV=production',
      (stage) => {
        const result = envSchema.safeParse({
          ...validEnv,
          NODE_ENV: 'development',
          APP_STAGE: stage,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.some((issue) => issue.path.includes('NODE_ENV'))).toBe(true);
      }
    );

    it('should allow a staging stage to run with NODE_ENV=production', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'production',
        APP_STAGE: 'staging',
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ NODE_ENV: 'production', APP_STAGE: 'staging' });
    });

    it('should allow local stages to diverge from NODE_ENV', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'production',
        APP_STAGE: 'development',
      });

      expect(result.success).toBe(true);
    });

    it('should reject an unknown APP_STAGE', () => {
      const result = envSchema.safeParse({ ...validEnv, APP_STAGE: 'preview' });

      expect(result.success).toBe(false);
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

  describe('module load', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
      vi.resetModules();
    });

    it('loads .env files in development without throwing', async () => {
      vi.resetModules();
      vi.stubEnv('APP_STAGE', 'development');
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('DATABASE_URL', 'postgresql://localhost/db');
      vi.stubEnv('DATABASE_OWNER_URL', 'postgresql://localhost/db');
      // Don't actually touch the filesystem; just prove the dev branch calls it.
      const loadEnvFile = vi.spyOn(process, 'loadEnvFile').mockImplementation(() => {});

      const mod = await import('./env.ts');

      expect(loadEnvFile).toHaveBeenCalled();
      expect(mod.isDev()).toBe(true);
    });

    it('treats a staging stage as deployed without treating it as production', async () => {
      vi.resetModules();
      vi.stubEnv('APP_STAGE', 'staging');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('DATABASE_URL', 'postgresql://localhost/db');
      vi.stubEnv('DATABASE_OWNER_URL', 'postgresql://localhost/db');

      const mod = await import('./env.ts');

      expect(mod.isStaging()).toBe(true);
      expect(mod.isDeployed()).toBe(true);
      expect(mod.isProd()).toBe(false);
      expect(mod.isDev()).toBe(false);
    });

    it('treats production as deployed', async () => {
      vi.resetModules();
      vi.stubEnv('APP_STAGE', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('DATABASE_URL', 'postgresql://localhost/db');
      vi.stubEnv('DATABASE_OWNER_URL', 'postgresql://localhost/db');

      const mod = await import('./env.ts');

      expect(mod.isProd()).toBe(true);
      expect(mod.isDeployed()).toBe(true);
      expect(mod.isStaging()).toBe(false);
    });

    it('throws when the environment is invalid at load time', async () => {
      vi.resetModules();
      vi.stubEnv('APP_STAGE', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      // A production stage skips the .env loading, so parsing sees process.env
      // directly - drop a required var to force the load-time throw.
      vi.stubEnv('DATABASE_URL', undefined);

      await expect(import('./env.ts')).rejects.toThrow('Invalid environment variables');
    });
  });
});
