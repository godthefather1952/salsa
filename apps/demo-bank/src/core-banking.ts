/**
 * Stand-in for the bank's own core banking system. A real bank already has
 * customers, accounts and balances in its own databases. This demo generates
 * them from the same fake data that salsa's database was seeded with, so both
 * sides agree, just as a real bank and salsa would after a data feed.
 */
import { type AccountKind, type IsoDate, sumCents } from '@salsa/core';
import {
  amortize,
  DEMO_BANKS,
  type DemoBank,
  type GeneratedAccount,
  type GeneratedCustomer,
  type GeneratedTransaction,
  generateAll,
} from '@salsa/fixtures';

/** What each checking account held on January 1. Made up, like everything else here. */
const OPENING_CHECKING_BALANCE_CENTS = 350_000;

export interface BankAccountView {
  key: string;
  kind: AccountKind;
  name: string;
  mask: string;
  /** Checking: money available. Card and loans: amount owed. */
  balanceCents: number;
  balanceLabel: string;
}

export interface BankCustomer {
  personaId: string;
  /** The id the bank uses for this customer when it talks to salsa. */
  customerRef: string;
  displayName: string;
  firstName: string;
  summary: string;
  accounts: BankAccountView[];
  transactions: GeneratedTransaction[];
}

export function findBank(slug: string): DemoBank | undefined {
  return DEMO_BANKS.find((bank) => bank.slug === slug);
}

function balanceOf(
  account: GeneratedAccount,
  transactions: GeneratedTransaction[],
  through: IsoDate,
): number {
  const own = transactions.filter((txn) => txn.accountKey === account.key);
  switch (account.kind) {
    case 'checking':
    case 'savings':
      return OPENING_CHECKING_BALANCE_CENTS + sumCents(own.map((txn) => txn.amountCents));
    case 'credit_card':
      // Purchases are negative and payments positive, so the amount owed is the negated sum.
      return Math.max(0, -sumCents(own.map((txn) => txn.amountCents)));
    default: {
      if (!account.loan) return 0;
      const paid = amortize(account.loan).filter((row) => row.dueOn <= through);
      return paid.at(-1)?.balanceCents ?? account.loan.principalCents;
    }
  }
}

const BALANCE_LABELS: Record<AccountKind, string> = {
  checking: 'Available balance',
  savings: 'Available balance',
  credit_card: 'Current balance',
  mortgage: 'Principal remaining',
  auto_loan: 'Principal remaining',
  student_loan: 'Principal remaining',
};

function toBankCustomer(customer: GeneratedCustomer, through: IsoDate): BankCustomer {
  return {
    personaId: customer.personaId,
    customerRef: `cust_${customer.personaId}`,
    displayName: customer.displayName,
    firstName: customer.displayName.split(' ')[0] ?? customer.displayName,
    summary: customer.summary,
    accounts: customer.accounts.map((account) => ({
      key: account.key,
      kind: account.kind,
      name: account.name,
      mask: account.mask,
      balanceCents: balanceOf(account, customer.transactions, through),
      balanceLabel: BALANCE_LABELS[account.kind],
    })),
    transactions: customer.transactions,
  };
}

const cache = new Map<string, BankCustomer[]>();

/** Every customer of a bank, with activity for the current year up to `through`. */
export function customersOf(bank: DemoBank, through: IsoDate): BankCustomer[] {
  const cacheKey = `${bank.slug}:${through}`;
  let customers = cache.get(cacheKey);
  if (!customers) {
    // Same seed as salsa's `pnpm db:seed`, so both systems hold the same transactions.
    customers = generateAll({ taxYear: Number(through.slice(0, 4)), seed: bank.slug, through }).map(
      (customer) => toBankCustomer(customer, through),
    );
    cache.set(cacheKey, customers);
  }
  return customers;
}

export function findCustomer(
  bank: DemoBank,
  personaId: string,
  through: IsoDate,
): BankCustomer | undefined {
  return customersOf(bank, through).find((customer) => customer.personaId === personaId);
}
