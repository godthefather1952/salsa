import { generateAll } from '@salsa/fixtures';
import { inArray } from 'drizzle-orm';
import type { Database } from './client';
import { accounts, customers, type TenantBranding, tenants, transactions } from './schema';

/** Two fictional banks, so the demo can show the same widget in two brands. */
export const DEMO_TENANTS = [
  {
    slug: 'tidewater',
    name: 'Tidewater Demo Bank',
    branding: { primaryColor: '#0B6E6E', accentColor: '#F2A541', logoText: 'Tidewater' },
  },
  {
    slug: 'summit',
    name: 'Summit Demo Credit Union',
    branding: { primaryColor: '#3D2C8D', accentColor: '#2EC4B6', logoText: 'Summit CU' },
  },
] as const satisfies ReadonlyArray<{ slug: string; name: string; branding: TenantBranding }>;

export interface SeedOptions {
  taxYear: number;
  /** Only load transactions up to this date, to simulate a year in progress. */
  through?: string;
}

export interface SeedCounts {
  tenants: number;
  customers: number;
  accounts: number;
  transactions: number;
}

const BATCH_SIZE = 500;

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Seed bug: missing ${what}`);
  return value;
}

/**
 * Replaces the demo banks and their customers with freshly generated data.
 * Safe to run repeatedly. Tenants that are not demo banks are left alone.
 */
export async function seedDemoData(db: Database, options: SeedOptions): Promise<SeedCounts> {
  return db.transaction(async (tx) => {
    // Deleting a tenant cascades to its customers, accounts and transactions.
    await tx.delete(tenants).where(
      inArray(
        tenants.slug,
        DEMO_TENANTS.map((tenant) => tenant.slug),
      ),
    );

    const counts: SeedCounts = { tenants: 0, customers: 0, accounts: 0, transactions: 0 };

    for (const demo of DEMO_TENANTS) {
      const [tenant] = await tx
        .insert(tenants)
        .values({ slug: demo.slug, name: demo.name, branding: demo.branding })
        .returning({ id: tenants.id });
      const tenantId = required(tenant, 'tenant').id;
      counts.tenants++;

      // Same personas at every bank, with different random details per bank.
      const people = generateAll({
        taxYear: options.taxYear,
        seed: demo.slug,
        ...(options.through ? { through: options.through } : {}),
      });

      for (const person of people) {
        const [customer] = await tx
          .insert(customers)
          .values({
            tenantId,
            externalRef: `cust_${person.personaId}`,
            displayName: person.displayName,
            birthYear: person.birthYear,
            // A real bank would not know this; the demo pretends the customer
            // already answered salsa's one-question onboarding.
            filingStatus: person.filingStatus,
            state: person.state,
          })
          .returning({ id: customers.id });
        const customerId = required(customer, 'customer').id;
        counts.customers++;

        const accountRows = await tx
          .insert(accounts)
          .values(
            person.accounts.map((account) => ({
              tenantId,
              customerId,
              externalRef: `${person.personaId}-${account.key}`,
              kind: account.kind,
              name: account.name,
              mask: account.mask,
              openedOn: account.openedOn,
              loan: account.loan,
            })),
          )
          .returning({ id: accounts.id, externalRef: accounts.externalRef });
        const accountIds = new Map(accountRows.map((row) => [row.externalRef, row.id]));
        counts.accounts += accountRows.length;

        // `truthCategory` is the test answer key and is deliberately not stored.
        const rows = person.transactions.map((txn) => ({
          tenantId,
          customerId,
          accountId: required(
            accountIds.get(`${person.personaId}-${txn.accountKey}`),
            `account ${txn.accountKey}`,
          ),
          externalRef: txn.key,
          postedOn: txn.postedOn,
          amountCents: txn.amountCents,
          description: txn.description,
          merchantName: txn.merchantName,
          mcc: txn.mcc,
          type: txn.type,
        }));
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          await tx.insert(transactions).values(rows.slice(i, i + BATCH_SIZE));
        }
        counts.transactions += rows.length;
      }
    }

    return counts;
  });
}
