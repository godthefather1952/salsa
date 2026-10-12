/**
 * Core vocabulary shared by every part of salsa: the fake data generator,
 * the API and database, the tax rules, and the widget.
 */

export const FILING_STATUSES = [
  'single',
  'married_joint',
  'married_separate',
  'head_of_household',
  'qualifying_surviving_spouse',
] as const;
export type FilingStatus = (typeof FILING_STATUSES)[number];

export const ACCOUNT_KINDS = [
  'checking',
  'savings',
  'credit_card',
  'mortgage',
  'auto_loan',
  'student_loan',
] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

export const LOAN_ACCOUNT_KINDS = [
  'mortgage',
  'auto_loan',
  'student_loan',
] as const satisfies readonly AccountKind[];
export type LoanAccountKind = (typeof LOAN_ACCOUNT_KINDS)[number];

export function isLoanAccountKind(kind: AccountKind): kind is LoanAccountKind {
  return (LOAN_ACCOUNT_KINDS as readonly AccountKind[]).includes(kind);
}

/**
 * Transaction types.
 *
 * Sign convention for `amountCents`:
 * - Checking, savings and credit card accounts: negative means money left the
 *   account (a purchase, a bill, a transfer out); positive means money came in.
 * - Loan accounts: each payment is recorded as two positive lines, the part
 *   applied to interest (`loan_interest`) and the part applied to principal
 *   (`loan_principal`). The bank's loan system knows this split, which is what
 *   lets salsa find deductible interest without asking the customer.
 */
export const TRANSACTION_TYPES = [
  'purchase',
  'deposit',
  'transfer',
  'bill_payment',
  'loan_interest',
  'loan_principal',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Details the bank holds about a vehicle securing an auto loan. */
export interface VehicleDetails {
  modelYear: number;
  condition: 'new' | 'used';
  /** ISO 3166-1 alpha-2 country of final assembly, from the VIN. */
  finalAssemblyCountry: string;
  use: 'personal' | 'business';
}

/** Terms of a loan account, as recorded by the bank at origination. */
export interface LoanDetails {
  principalCents: number;
  /** Annual rate as a percent, e.g. 6.875. Amounts derived from it are rounded to whole cents. */
  aprPercent: number;
  termMonths: number;
  originatedOn: string;
  firstPaymentOn: string;
  vehicle?: VehicleDetails;
}
