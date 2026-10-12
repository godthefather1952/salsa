import type { WidgetMeResponse } from '@salsa/core';

type LoanInterest = WidgetMeResponse['loanInterest'][number];

export interface Finding {
  id: string;
  title: string;
  account: string;
  explanation: string;
  amountCents: number;
}

/**
 * Plain-language wording for each kind of loan interest. Whether an amount is
 * actually deductible is decided by the tax engine (coming next); until then
 * the wording says what can lower taxes, never that it will.
 */
function explain(item: LoanInterest): { title: string; explanation: string } {
  switch (item.kind) {
    case 'mortgage':
      return {
        title: 'Mortgage interest',
        explanation: 'Interest on a home loan can lower your taxes if you itemize your deductions.',
      };
    case 'auto_loan': {
      const vehicle = item.vehicle;
      const qualifiesOnPaper =
        vehicle?.condition === 'new' &&
        vehicle.finalAssemblyCountry === 'US' &&
        vehicle.use === 'personal';
      return {
        title: 'Car loan interest',
        explanation: qualifiesOnPaper
          ? `Your loan is for a new ${vehicle.modelYear} vehicle assembled in the US. Interest on loans like this can lower your taxes even if you don't itemize, within income limits.`
          : 'We are checking whether interest on this loan qualifies.',
      };
    }
    case 'student_loan':
      return {
        title: 'Student loan interest',
        explanation: 'Student loan interest can lower your taxes, up to a yearly limit.',
      };
    default:
      return {
        title: 'Loan interest',
        explanation: 'We are checking whether this interest qualifies.',
      };
  }
}

export function findingsFrom(data: WidgetMeResponse): Finding[] {
  return data.loanInterest
    .filter((item) => item.interestCents > 0)
    .map((item) => ({
      id: item.accountId,
      ...explain(item),
      account: `${item.accountName} ending ${item.mask}`,
      amountCents: item.interestCents,
    }));
}

/** What the next version of the tax engine adds. Shown so the preview is honest about its scope. */
export const STILL_CHECKING = [
  'Donations to charities and places of worship',
  'Medical, dental and pharmacy costs',
  'Property taxes',
  'Whether itemizing beats the standard deduction for you',
];
