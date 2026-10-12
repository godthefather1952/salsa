import { sql } from 'drizzle-orm';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config';
import type { Database } from './db/client';
import { widgetRoutes } from './routes/widget';

export interface AppOptions {
  db: Database;
  sessionSecret: string;
  tokenTtlSeconds?: number;
  logLevel?: Config['LOG_LEVEL'];
  /** Injectable clock for tests. Milliseconds since the epoch. */
  now?: () => number;
}

/**
 * Builds the HTTP app without starting it, so tests can call routes with
 * `app.inject()` and no network port.
 */
export function buildApp({
  db,
  sessionSecret,
  tokenTtlSeconds = 900,
  logLevel = 'info',
  now = Date.now,
}: AppOptions): FastifyInstance {
  const app = Fastify({ logger: logLevel === 'silent' ? false : { level: logLevel } });

  app.get('/', async () => ({
    name: 'salsa-api',
    message: 'Tax deduction finder for banks. See /health.',
  }));

  app.get('/health', async (_request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: 'ok', database: 'ok' };
    } catch (error) {
      app.log.error({ err: error }, 'database health check failed');
      return reply.code(503).send({ status: 'degraded', database: 'unreachable' });
    }
  });

  app.register(widgetRoutes, { db, sessionSecret, tokenTtlSeconds, now });

  return app;
}
