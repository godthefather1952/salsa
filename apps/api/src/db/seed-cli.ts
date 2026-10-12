/**
 * pnpm db:seed                      # current year, up to today (like a live bank)
 * pnpm db:seed --full-year          # current year including future months
 * pnpm db:seed --year 2026 --through 2026-06-30
 */
import { parseArgs } from 'node:util';
import { todayIso } from '@salsa/core';
import { loadConfig } from '../config';
import { openDatabase } from './client';
import { seedDemoData } from './seed';

const today = todayIso();
const { values } = parseArgs({
  options: {
    year: { type: 'string', default: today.slice(0, 4) },
    through: { type: 'string' },
    'full-year': { type: 'boolean', default: false },
  },
});

// A real bank only has transactions up to today, so that is the default for the current year.
const through =
  values.through ?? (!values['full-year'] && values.year === today.slice(0, 4) ? today : undefined);

const config = loadConfig();
const handle = await openDatabase(config.DATABASE_URL);
try {
  const counts = await seedDemoData(handle.db, {
    taxYear: Number(values.year),
    ...(through ? { through } : {}),
  });
  console.log(
    `Seeded ${counts.tenants} banks, ${counts.customers} customers, ` +
      `${counts.accounts} accounts, ${counts.transactions} transactions ` +
      `for ${values.year}${through ? ` through ${through}` : ''} (${handle.driver}).`,
  );
} finally {
  await handle.close();
}
