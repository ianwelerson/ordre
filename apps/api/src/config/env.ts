import { z } from 'zod';

const stage = process.env.APP_STAGE ?? process.env.NODE_ENV ?? 'development';

if (stage === 'development') {
  try {
    process.loadEnvFile('../../.env');
    process.loadEnvFile('.env');
  } catch {
    // .env is optional in development
  }
} else if (stage === 'test') {
  try {
    process.loadEnvFile('../../.env.test');
    process.loadEnvFile('.env.test');
  } catch {
    // .env.test is optional in test
  }
}

/**
 * Which deployment this process is - as opposed to `NODE_ENV`, which only says
 * whether to run optimized. Tooling (Express, bundlers, pino-pretty, pnpm's
 * devDependency pruning) branches on `NODE_ENV`, so it stays at `production`
 * for every deployed stage; `APP_STAGE` is what tells staging from production.
 */
const APP_STAGES = ['development', 'test', 'staging', 'production'] as const;

type AppStage = (typeof APP_STAGES)[number];

/** Stages that run on real infrastructure, and so must run optimized. */
const DEPLOYED_STAGES: readonly AppStage[] = ['staging', 'production'];

/**
 * A public origin one of our apps is reachable at.
 *
 * The trailing slash is stripped so callers can concatenate a path straight on;
 * otherwise `https://host/` + `/login` silently produces a double slash, which is
 * the kind of thing that only shows up in an email that already went out.
 */
const originUrl = z.url().transform((value) => value.replace(/\/+$/, ''));

/**
 * A boolean read from an environment variable, where every value arrives as a
 * string. An unset or empty variable falls back to the given value, so a key left
 * blank in `.env` reads the same as one that is not there at all.
 */
const flag = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((value) => (value === '' ? undefined : value))
    .pipe(z.stringbool().default(fallback));

/**
 * A UUID that need not be set. Blank reads the same as unset, for the same reason
 * as {@link flag}: a key left empty in `.env` must not fail the parse where an
 * absent one would have been fine.
 */
const optionalUuid = z
  .string()
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .pipe(z.uuid().optional());

export const envSchema = z
  .object({
    // App Config
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_STAGE: z.enum(APP_STAGES).default('development'),
    PORT: z.coerce.number().positive().default(3000),
    // Database Config
    DATABASE_URL: z.string().startsWith('postgresql://'),
    DATABASE_OWNER_URL: z.string().startsWith('postgresql://'),
    // Better Auth Config
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: originUrl,
    // App URLs
    APP_BASE_URL: originUrl,
    APP_DASHBOARD_URL: originUrl,
    APP_BOARD_URL: originUrl,
    APP_DOCS_URL: originUrl,
    // Outbox Email
    DISABLE_OUTBOX_EMAIL: flag(false),
    // Resend
    RESEND_API_KEY: z.string().min(1),
    RESEND_SEGMENT_ALL_ACCOUNTS: optionalUuid,
    RESEND_SEGMENT_WORKSPACE_OWNER: optionalUuid,
    RESEND_SEGMENT_WORKSPACE_MEMBER: optionalUuid,
    RESEND_TOPIC_PRODUCT_NEWS: optionalUuid,
    RESEND_TOPIC_WORKSPACE_UPDATES: optionalUuid,
  })
  .refine((data) => !DEPLOYED_STAGES.includes(data.APP_STAGE) || data.NODE_ENV === 'production', {
    message: `NODE_ENV must be "production" when APP_STAGE is one of: ${DEPLOYED_STAGES.join(', ')}`,
    path: ['NODE_ENV'],
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
export const isStaging = () => env.APP_STAGE === 'staging';
export const isDev = () => env.APP_STAGE === 'development';
export const isTest = () => env.APP_STAGE === 'test';

/**
 * True on any stage running against real infrastructure. Prefer this over
 * `isProd()` for guards that staging must also honour - rate limits, webhook
 * signature checks, "don't send this email to a real customer" fuses.
 */
export const isDeployed = () => DEPLOYED_STAGES.includes(env.APP_STAGE);

export default env;
