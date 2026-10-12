import { describe, expect, it } from 'vitest';
import {
  createRng,
  type GeneratedCustomer,
  generateAll,
  hashSeed,
  PERSONA_IDS,
  type TruthCategory,
} from '../src';

const TAX_YEAR = 2026;
const customers = generateAll({ taxYear: TAX_YEAR });

function persona(id: string): GeneratedCustomer {
  const found = customers.find((customer) => customer.personaId === id);
  if (!found) throw new Error(`No persona ${id}`);
  return found;
}

function total(customer: GeneratedCustomer, category: TruthCategory): number {
  return customer.transactions
    .filter((txn) => txn.truthCategory === category)
    .reduce((sum, txn) => sum + Math.abs(txn.amountCents), 0);
}

describe('random', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng(hashSeed('x', 1));
    const b = createRng(hashSeed('x', 1));
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(
      Array.from({ length: 5 }, () => b.next()),
    );
  });
});

describe('generateAll', () => {
  it('creates every persona', () => {
    expect(customers.map((customer) => customer.personaId)).toEqual([...PERSONA_IDS]);
  });

  it('is deterministic for a given seed', () => {
    expect(generateAll({ taxYear: TAX_YEAR })).toEqual(customers);
  });

  it('produces different data for a different seed', () => {
    const other = generateAll({ taxYear: TAX_YEAR, seed: 'another' });
    expect(other[0]?.transactions).not.toEqual(customers[0]?.transactions);
  });

  it.each(PERSONA_IDS)('%s has well-formed transactions', (id) => {
    const customer = persona(id);
    const accountKeys = new Set(customer.accounts.map((account) => account.key));
    const dates = customer.transactions.map((txn) => txn.postedOn);

    expect(customer.transactions.length).toBeGreaterThan(200);
    expect(dates).toEqual([...dates].sort());
    for (const txn of customer.transactions) {
      expect(txn.postedOn >= `${TAX_YEAR}-01-01` && txn.postedOn <= `${TAX_YEAR}-12-31`).toBe(true);
      expect(Number.isSafeInteger(txn.amountCents)).toBe(true);
      expect(txn.amountCents).not.toBe(0);
      expect(accountKeys.has(txn.accountKey)).toBe(true);
      if (txn.mcc !== null) expect(txn.mcc).toMatch(/^\d{4}$/);
    }
  });

  it('gives every transaction a unique key', () => {
    const keys = customers.flatMap((customer) => customer.transactions.map((txn) => txn.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps transaction keys stable when the year is still in progress', () => {
    const partial = generateAll({ taxYear: TAX_YEAR, through: `${TAX_YEAR}-06-30` });
    const full = persona('maya').transactions;
    const half = partial[0]?.transactions ?? [];
    expect(half.length).toBeGreaterThan(0);
    expect(half.length).toBeLessThan(full.length);
    expect(half).toEqual(full.slice(0, half.length));
  });

  it('pays off each month of card purchases the following month', () => {
    for (const customer of customers) {
      const card = customer.transactions.filter((txn) => txn.accountKey === 'credit_card');
      for (let month = 1; month <= 11; month++) {
        const mm = String(month).padStart(2, '0');
        const spent = card
          .filter((txn) => txn.type === 'purchase' && txn.postedOn.slice(5, 7) === mm)
          .reduce((sum, txn) => sum - txn.amountCents, 0);
        const next = String(month + 1).padStart(2, '0');
        const paid = card
          .filter((txn) => txn.type === 'transfer' && txn.postedOn === `${TAX_YEAR}-${next}-20`)
          .reduce((sum, txn) => sum + txn.amountCents, 0);
        expect(paid).toBe(spent);
      }
    }
  });
});

describe('personas', () => {
  it('maya: mortgage interest, property tax and giving beat the married standard deduction', () => {
    const maya = persona('maya');
    const interest = total(maya, 'mortgage_interest');
    expect(interest).toBeGreaterThan(2_500_000);
    expect(interest).toBeLessThan(3_000_000);
    expect(total(maya, 'property_tax')).toBe(740_000);
    const itemizable = interest + total(maya, 'property_tax') + total(maya, 'charity');
    expect(itemizable).toBeGreaterThan(3_220_000); // 2026 married filing jointly standard deduction
  });

  it('jordan: a new US-assembled car loan starts paying interest in April', () => {
    const jordan = persona('jordan');
    const autoLoan = jordan.accounts.find((account) => account.kind === 'auto_loan');
    expect(autoLoan?.loan?.vehicle).toMatchObject({ condition: 'new', finalAssemblyCountry: 'US' });

    const interest = jordan.transactions.filter((txn) => txn.type === 'loan_interest');
    expect(interest).toHaveLength(9);
    expect(interest[0]?.postedOn).toBe(`${TAX_YEAR}-04-14`);
    expect(total(jordan, 'charity')).toBeLessThan(100_000);
  });

  it('ruth: is 65 or older with large medical costs and no loans', () => {
    const ruth = persona('ruth');
    expect(TAX_YEAR - ruth.birthYear).toBeGreaterThanOrEqual(65);
    expect(total(ruth, 'medical')).toBeGreaterThan(900_000);
    expect(ruth.accounts.every((account) => account.loan === null)).toBe(true);
  });

  it('sam: student loan payments go to an outside servicer, with no interest split', () => {
    const sam = persona('sam');
    const payments = sam.transactions.filter((txn) => txn.truthCategory === 'student_loan_payment');
    expect(payments).toHaveLength(12);
    expect(payments.every((txn) => txn.mcc === null)).toBe(true);
    expect(sam.transactions.some((txn) => txn.type === 'loan_interest')).toBe(false);
  });
});
