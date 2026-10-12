import { buildApp } from './app';
import { loadConfig } from './config';
import { openDatabase } from './db/client';

const config = loadConfig();
const database = await openDatabase(config.DATABASE_URL);
const app = buildApp({
  db: database.db,
  sessionSecret: config.SESSION_SECRET,
  tokenTtlSeconds: config.WIDGET_TOKEN_TTL_SECONDS,
  logLevel: config.LOG_LEVEL,
});

async function shutdown(signal: string) {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  await database.close();
  process.exit(0);
}
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: config.HOST, port: config.PORT });
