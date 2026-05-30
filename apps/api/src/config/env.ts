import { z } from 'zod';

const stage = process.env.APP_STAGE ?? process.env.NODE_ENV ?? 'development';

if (stage === 'development') {
  try {
    process.loadEnvFile('.env');
  } catch {
    // .env is optional in development
  }
} else if (stage === 'test') {
  try {
    process.loadEnvFile('.env.test');
  } catch {
    // .env.test is optional in test
  }
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_STAGE: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().positive().default(3000),
  })
  .refine((data) => data.NODE_ENV === data.APP_STAGE, {
    message: 'NODE_ENV and APP_STAGE must match',
    path: ['APP_STAGE'],
  });

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const messages = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${messages}`);
}

export const env: Env = parsed.data;
export const isProd = () => env.APP_STAGE === 'production';
export const isDev = () => env.APP_STAGE === 'development';
export const isTest = () => env.APP_STAGE === 'test';

export default env;
