import { addMonths, type IsoDate, type LoanDetails } from '@salsa/core';

export interface AmortizationRow {
  paymentNumber: number;
  dueOn: IsoDate;
  paymentCents: number;
  interestCents: number;
  principalCents: number;
  /** Balance left after this payment. */
  balanceCents: number;
}

type LoanTerms = Pick<LoanDetails, 'principalCents' | 'aprPercent' | 'termMonths'>;

/** Standard fixed-rate monthly payment, rounded to the cent. */
export function monthlyPaymentCents({ principalCents, aprPercent, termMonths }: LoanTerms): number {
  if (aprPercent === 0) return Math.ceil(principalCents / termMonths);
  const rate = aprPercent / 100 / 12;
  return Math.round((principalCents * rate) / (1 - (1 + rate) ** -termMonths));
}

/**
 * Splits every payment of a fixed-rate loan into interest and principal.
 * Interest is rounded each month, and the final payment absorbs any leftover
 * cents so the loan ends at exactly zero.
 */
export function amortize(loan: LoanTerms & Pick<LoanDetails, 'firstPaymentOn'>): AmortizationRow[] {
  const rate = loan.aprPercent / 100 / 12;
  const payment = monthlyPaymentCents(loan);
  const rows: AmortizationRow[] = [];
  let balance = loan.principalCents;

  for (let n = 1; n <= loan.termMonths && balance > 0; n++) {
    const interest = Math.round(balance * rate);
    if (payment <= interest)
      throw new Error('Payment does not cover interest; loan never amortizes');
    const isLast = n === loan.termMonths;
    const principal = isLast ? balance : Math.min(payment - interest, balance);
    balance -= principal;
    rows.push({
      paymentNumber: n,
      dueOn: addMonths(loan.firstPaymentOn, n - 1),
      paymentCents: principal + interest,
      interestCents: interest,
      principalCents: principal,
      balanceCents: balance,
    });
  }

  return rows;
}
