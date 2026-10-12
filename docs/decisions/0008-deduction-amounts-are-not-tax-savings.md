# 0008. Deduction amounts are never shown as tax savings

- Status: Accepted (the rule); Proposed (the estimate method)
- Date: 2026-10-12

## Context

$1,800 of donations does not reduce someone's taxes by $1,800. If the customer takes the standard deduction it may reduce them by nothing. Showing spending or deduction amounts as savings would mislead customers and expose banks to complaints.

## Decision

- Amounts are always labeled as what they are: "Interest paid", "Donations made", "Medical costs paid". Never "savings", "refund" or "money back".
- Proposed estimate method, used only where reasonably calculable:
  - shown only when filing status and an income range are known;
  - federal income tax only, shown as a range, with its assumptions listed;
  - for itemized deductions, only the amount by which itemizing exceeds the standard deduction counts;
  - for deductions available to all filers, the deductible amount (after caps and income limits) times the applicable marginal rate range.
- The estimate is labeled "Estimated effect on your federal income tax".

## Consequences

- A copy check in CI rejects amount labels containing "save", "saving", "refund" or "money back".
- Many customers will see no estimate until they answer two profile questions. That is honest.
