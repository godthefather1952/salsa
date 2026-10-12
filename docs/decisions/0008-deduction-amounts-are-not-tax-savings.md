# 0008. Deduction amounts are never shown as tax savings

- Status: Accepted
- Date: 2026-10-12

## Context

$1,800 of donations does not reduce someone's taxes by $1,800. If the customer takes the standard deduction it may reduce them by nothing. Showing spending or deduction amounts as savings would mislead customers and expose banks to complaints.

## Decision

- Amounts are always labeled as what they are: "Interest paid", "Donations made", "Medical costs paid". Never "savings", "refund" or "money back".
- A tax-effect estimate is shown only where reasonably calculable:
  - only when filing status and an AGI range are known from the customer ([ADR 0009](0009-income-information.md)), never from deposits;
  - federal income tax only, shown as a range, with its assumptions listed;
  - the marginal rate range comes from the customer's AGI range and the deductions in play, so a wide AGI range produces a wide estimate or none;
  - for itemized deductions, only the amount by which itemizing exceeds the standard deduction counts, and only when the comparison is not incomplete ([states](../product/opportunity-feed/states.md));
  - for deductions available to all filers, the deductible amount (after caps and income limits) times the applicable marginal rate range.
- The estimate is labeled "Estimated effect on your federal income tax" and appears in Summary (Phase 3), per design decision Q4.

## Consequences

- A copy check in CI rejects amount labels and explanatory text containing "save", "saving", "refund" or "money back".
- Many customers will see no estimate until they answer the profile questions. That is honest.
