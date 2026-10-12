import { z } from 'zod';

/** Fine for local demos. The API refuses to start in production with this value. */
export const DEV_SESSION_SECRET = 'dev-only-session-secret-do-not-use-in-production';

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().positive().default(3001),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    /**
     * `pglite://<folder>` runs Postgres inside Node with no install (great for local dev).
     * `pglite://memory` keeps it in memory (tests).
     * `postgres://...` connects to a real server such as Neon, Supabase or Docker.
     */
    DATABASE_URL: z.string().default('pglite://.data/salsa'),
    /** Signs widget tokens. At least 32 characters; keep it secret. */
    SESSION_SECRET: z.string().min(32).default(DEV_SESSION_SECRET),
    /** How long a widget token works. Short, because it sits in a browser. */
    WIDGET_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  })
  .superRefine((config, ctx) => {
    if (config.NODE_ENV === 'production' && config.SESSION_SECRET === DEV_SESSION_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_SECRET'],
        message: 'Set a real SESSION_SECRET in production.',
      });
    }
  });

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Read apps/api/.env if it exists. Real environment variables win.
  if (env === process.env) {
    try {
      process.loadEnvFile();
    } catch {
      // No .env file: defaults apply.
    }
  }

  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
