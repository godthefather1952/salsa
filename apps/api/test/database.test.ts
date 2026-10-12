import { generateAll } from '@salsa/fixtures';
import { and, count, eq, sum } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DatabaseHandle } from '../src/db/client';
import { accounts, customers, tenants, transactions } from '../src/db/schema';
import { DEMO_TENANTS, type SeedCounts, seedDemoData } from '../src/db/seed';
import { expectConstraintViolation, memoryDatabase } from './helpers';

const TAX_YEAR = 2026;

let handle: DatabaseHandle;
let seeded: SeedCounts;

beforeAll(async () => {
  handle = await memoryDatabase();
  seeded = await seedDemoData(handle.db, { taxYear: TAX_YEAR });
});

afterAll(async () => {
  await handle.close();
});

async function rowCount(
  table: typeof tenants | typeof customers | typeof accounts | typeof transactions,
) {
  const [row] = await handle.db.select({ n: count() }).from(table);
  return row?.n ?? 0;
}

async function findCustomer(tenantSlug: string, externalRef: string) {
  const [row] = await handle.db
    .select({ tenantId: customers.tenantId, customerId: customers.id })
    .from(customers)
    .innerJoin(tenants, eq(customers.tenantId, tenants.id))
    .where(and(eq(tenants.slug, tenantSlug), eq(customers.externalRef, externalRef)));
  if (!row) throw new Error(`No ${externalRef} at ${tenantSlug}`);
  return row;
}

describe('seeding', () => {
  it('creates two banks with four customers each', async () => {
    expect(seeded.tenants).toBe(DEMO_TENANTS.length);
    expect(seeded.customers).toBe(8);
    expect(await rowCount(tenants)).toBe(2);
    expect(await rowCount(customers)).toBe(8);
  });

  it('loads every generated transaction', async () => {
    const expected = DEMO_TENANTS.reduce(
      (total, tenant) =>
        total +
        generateAll({ taxYear: TAX_YEAR, seed: tenant.slug }).reduce(
          (sumForBank, person) => sumForBank + person.transactions.length,
          0,
        ),
      0,
    );
    expect(seeded.transactions).toBe(expected);
    expect(await rowCount(transactions)).toBe(expected);
  });

  it('keeps loan interest on the loan account where the bank records it', async () => {
    const maya = await findCustomer('tidewater', 'cust_maya');
    const [row] = await handle.db
      .select({ interest: sum(transactions.amountCents).mapWith(Number) })
      .from(transactions)
      .where(
        and(eq(transactions.customerId, maya.customerId), eq(transactions.type, 'loan_interest')),
      );
    expect(row?.interest).toBeGreaterThan(2_500_000);
  });

  it('stores the vehicle details on the auto loan', async () => {
    const jordan = await findCustomer('summit', 'cust_jordan');
    const [loan] = await handle.db
      .select({ loan: accounts.loan })
      .from(accounts)
      .where(and(eq(accounts.customerId, jordan.customerId), eq(accounts.kind, 'auto_loan')));
    expect(loan?.loan?.vehicle).toMatchObject({ condition: 'new', finalAssemblyCountry: 'US' });
  });

  it('is safe to run again', async () => {
    const again = await seedDemoData(handle.db, { taxYear: TAX_YEAR });
    expect(again).toEqual(seeded);
    expect(await rowCount(transactions)).toBe(seeded.transactions);
  });

  it('can load a year that is still in progress', async () => {
    const partial = await seedDemoData(handle.db, { taxYear: TAX_YEAR, through: '2026-06-30' });
    expect(partial.transactions).toBeLessThan(seeded.transactions);
    await seedDemoData(handle.db, { taxYear: TAX_YEAR });
  });
});

describe('tenant isolation', () => {
  it("refuses to attach an account to another bank's customer", async () => {
    const summit = await findCustomer('summit', 'cust_maya');
    const tidewater = await findCustomer('tidewater', 'cust_maya');
    await expectConstraintViolation(
      handle.db.insert(accounts).values({
        tenantId: summit.tenantId,
        customerId: tidewater.customerId,
        externalRef: 'cross-bank',
        kind: 'checking',
        name: 'Should fail',
        mask: '0000',
        openedOn: '2026-01-01',
      }),
      'accounts_customer_fk',
    );
  });

  it("refuses a transaction on someone else's account", async () => {
    const maya = await findCustomer('tidewater', 'cust_maya');
    const sam = await findCustomer('tidewater', 'cust_sam');
    const [samChecking] = await handle.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.customerId, sam.customerId), eq(accounts.kind, 'checking')));
    await expectConstraintViolation(
      handle.db.insert(transactions).values({
        tenantId: maya.tenantId,
        customerId: maya.customerId,
        accountId: samChecking?.id ?? '',
        externalRef: 'wrong-owner',
        postedOn: '2026-05-01',
        amountCents: -100,
        description: 'Should fail',
        type: 'purchase',
      }),
      'transactions_account_fk',
    );
  });

  it('refuses a duplicate transaction from the same bank feed', async () => {
    const [existing] = await handle.db.select().from(transactions).limit(1);
    if (!existing) throw new Error('No transactions');
    const { id: _id, createdAt: _createdAt, ...copy } = existing;
    await expectConstraintViolation(
      handle.db.insert(transactions).values(copy),
      'transactions_tenant_external_ref',
    );
  });
});
