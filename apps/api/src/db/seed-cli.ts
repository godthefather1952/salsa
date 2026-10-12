/**
 * pnpm db:seed                          # full current tax year
 * pnpm db:seed --year 2026 --through 2026-10-12
 */
import { parseArgs } from 'node:util';
import { loadConfig } from '../config';
import { openDatabase } from './client';
import { seedDemoData } from './seed';

const { values } = parseArgs({
  options: {
    year: { type: 'string', default: String(new Date().getFullYear()) },
    through: { type: 'string' },
  },
});

const config = loadConfig();
const handle = await openDatabase(config.DATABASE_URL);
try {
  const counts = await seedDemoData(handle.db, {
    taxYear: Number(values.year),
    ...(values.through ? { through: values.through } : {}),
  });
  console.log(
    `Seeded ${counts.tenants} banks, ${counts.customers} customers, ` +
      `${counts.accounts} accounts, ${counts.transactions} transactions (${handle.driver}).`,
  );
} finally {
  await handle.close();
}
