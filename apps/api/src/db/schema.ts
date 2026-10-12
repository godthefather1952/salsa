import { ACCOUNT_KINDS, FILING_STATUSES, type LoanDetails, TRANSACTION_TYPES } from '@salsa/core';
import {
  bigint,
  char,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/*
 * Multi-tenancy: every bank is a tenant, and every row carries `tenant_id`.
 *
 * Child tables reference their parent with composite foreign keys that include
 * tenant_id, so the database itself refuses to attach one bank's account to
 * another bank's customer, or a transaction to someone else's account. An
 * application bug cannot mix data across banks through a bad id.
 */

export const filingStatus = pgEnum('filing_status', FILING_STATUSES);
export const accountKind = pgEnum('account_kind', ACCOUNT_KINDS);
export const transactionType = pgEnum('transaction_type', TRANSACTION_TYPES);

export interface TenantBranding {
  primaryColor: string;
  accentColor: string;
  /** Wordmark text shown in the widget header until banks upload a logo. */
  logoText: string;
}

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  branding: jsonb('branding').$type<TenantBranding>().notNull(),
  createdAt: createdAt(),
});

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    /** The bank's own id for this customer. Salsa never sees logins or SSNs. */
    externalRef: text('external_ref').notNull(),
    displayName: text('display_name').notNull(),
    /** Birth year only (not full date of birth): enough for age-based deductions. */
    birthYear: integer('birth_year'),
    /** Banks do not know filing status; the customer tells salsa. Null until they do. */
    filingStatus: filingStatus('filing_status'),
    state: char('state', { length: 2 }),
    createdAt: createdAt(),
  },
  (t) => [
    unique('customers_tenant_external_ref').on(t.tenantId, t.externalRef),
    unique('customers_tenant_id').on(t.tenantId, t.id),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    externalRef: text('external_ref').notNull(),
    kind: accountKind('kind').notNull(),
    name: text('name').notNull(),
    mask: char('mask', { length: 4 }).notNull(),
    openedOn: date('opened_on', { mode: 'string' }).notNull(),
    /** Loan terms and vehicle details for loan accounts; null otherwise. */
    loan: jsonb('loan').$type<LoanDetails>(),
    createdAt: createdAt(),
  },
  (t) => [
    unique('accounts_tenant_external_ref').on(t.tenantId, t.externalRef),
    unique('accounts_tenant_customer_id').on(t.tenantId, t.customerId, t.id),
    foreignKey({
      name: 'accounts_customer_fk',
      columns: [t.tenantId, t.customerId],
      foreignColumns: [customers.tenantId, customers.id],
    }).onDelete('cascade'),
    index('accounts_customer_idx').on(t.customerId),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    accountId: uuid('account_id').notNull(),
    /** The bank's transaction id, so re-sending the same feed never duplicates rows. */
    externalRef: text('external_ref').notNull(),
    postedOn: date('posted_on', { mode: 'string' }).notNull(),
    /** Signed integer cents; see the sign convention in @salsa/core. */
    amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
    description: text('description').notNull(),
    merchantName: text('merchant_name'),
    /** Merchant category code from the card network; null for ACH, transfers and loan lines. */
    mcc: char('mcc', { length: 4 }),
    type: transactionType('type').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique('transactions_tenant_external_ref').on(t.tenantId, t.externalRef),
    // Also guarantees customer_id matches the account's owner.
    foreignKey({
      name: 'transactions_account_fk',
      columns: [t.tenantId, t.customerId, t.accountId],
      foreignColumns: [accounts.tenantId, accounts.customerId, accounts.id],
    }).onDelete('cascade'),
    index('transactions_customer_posted_idx').on(t.customerId, t.postedOn),
    index('transactions_account_posted_idx').on(t.accountId, t.postedOn),
  ],
);
