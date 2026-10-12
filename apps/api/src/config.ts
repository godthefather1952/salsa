import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /**
   * `pglite://<folder>` runs Postgres inside Node with no install (great for local dev).
   * `pglite://memory` keeps it in memory (tests).
   * `postgres://...` connects to a real server such as Neon, Supabase or Docker.
   */
  DATABASE_URL: z.string().default('pglite://.data/salsa'),
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
