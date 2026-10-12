/** pnpm db:migrate — applies pending migrations to DATABASE_URL. */
import { loadConfig } from '../config';
import { openDatabase } from './client';

const config = loadConfig();
const handle = await openDatabase(config.DATABASE_URL);
try {
  await handle.migrate();
  console.log(`Migrations applied (${handle.driver}).`);
} finally {
  await handle.close();
}
