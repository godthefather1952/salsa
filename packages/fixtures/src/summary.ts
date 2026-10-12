/**
 * Prints what the fake data looks like for each persona.
 *
 *   pnpm fixtures                      # summary for the current year
 *   pnpm fixtures --year 2026 --json   # full data as JSON
 */
import { parseArgs } from 'node:util';
import { formatCents } from '@salsa/core';
import { generateAll } from './generate';
import type { TruthCategory } from './merchants';

const { values } = parseArgs({
  options: {
    year: { type: 'string', default: String(new Date().getFullYear()) },
    seed: { type: 'string', default: 'salsa' },
    through: { type: 'string' },
    json: { type: 'boolean', default: false },
  },
});

const customers = generateAll({
  taxYear: Number(values.year),
  seed: values.seed,
  ...(values.through ? { through: values.through } : {}),
});

if (values.json) {
  console.log(JSON.stringify(customers, null, 2));
} else {
  for (const customer of customers) {
    const totals = new Map<TruthCategory, number>();
    for (const txn of customer.transactions) {
      totals.set(
        txn.truthCategory,
        (totals.get(txn.truthCategory) ?? 0) + Math.abs(txn.amountCents),
      );
    }
    console.log(`\n${customer.displayName} (${customer.personaId}): ${customer.summary}`);
    console.log(
      `  ${customer.transactions.length} transactions across ${customer.accounts.map((a) => a.kind).join(', ')}`,
    );
    for (const [category, cents] of [...totals].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${category.padEnd(22)} ${formatCents(cents).padStart(14)}`);
    }
  }
}
