import { describe, expect, it } from 'vitest';
import { amortize, monthlyPaymentCents } from '../src';

const textbookLoan = {
  principalCents: 20_000_000, // $200,000
  aprPercent: 6,
  termMonths: 360,
  firstPaymentOn: '2026-02-01',
};

describe('amortization', () => {
  it('matches the textbook monthly payment', () => {
    // $200,000 at 6% for 30 years is $1,199.10 a month.
    expect(monthlyPaymentCents(textbookLoan)).toBe(119_910);
  });

  it('pays the loan off to exactly zero', () => {
    const rows = amortize(textbookLoan);
    expect(rows).toHaveLength(360);
    expect(rows.at(-1)?.balanceCents).toBe(0);
    const principalPaid = rows.reduce((sum, row) => sum + row.principalCents, 0);
    expect(principalPaid).toBe(textbookLoan.principalCents);
  });

  it('splits every payment into interest plus principal', () => {
    for (const row of amortize(textbookLoan)) {
      expect(row.interestCents + row.principalCents).toBe(row.paymentCents);
      expect(Number.isInteger(row.interestCents)).toBe(true);
    }
  });

  it('charges less interest as the balance falls', () => {
    const rows = amortize(textbookLoan);
    expect(rows[0]?.interestCents).toBe(100_000); // $200,000 * 0.5%
    expect(rows[1]?.interestCents).toBeLessThan(rows[0]?.interestCents ?? 0);
  });

  it('schedules payments monthly from the first due date', () => {
    const rows = amortize(textbookLoan);
    expect(rows.slice(0, 3).map((row) => row.dueOn)).toEqual([
      '2026-02-01',
      '2026-03-01',
      '2026-04-01',
    ]);
  });

  it('handles zero-interest loans', () => {
    const rows = amortize({
      ...textbookLoan,
      principalCents: 100_000,
      aprPercent: 0,
      termMonths: 12,
    });
    expect(rows.every((row) => row.interestCents === 0)).toBe(true);
    expect(rows.at(-1)?.balanceCents).toBe(0);
  });
});
