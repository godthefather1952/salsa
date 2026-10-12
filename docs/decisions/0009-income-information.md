# 0009. Rule-specific income measures, never inferred from deposits

- Status: Accepted
- Date: 2026-10-12 (accepted with refinements the same day)

## Context

Several rules depend on income, and they do not all use the same measure. Floors such as the one on medical expenses are based on adjusted gross income (AGI). Income limits on provisions such as the car loan interest deduction, the senior deduction and student loan interest use modified adjusted gross income (MAGI), and each provision defines its own modification.

A bank sees deposits into accounts at that bank. Deposits are take-home pay after withholding and benefits, miss income paid elsewhere, and include transfers and refunds that are not income at all. Neither deposits nor gross household income is AGI or MAGI.

## Decision

1. **Each rule declares its income measure.** Rules in `packages/tax-rules` state which measure they use (AGI, or the MAGI definition of that specific provision), its thresholds and phase-out ranges, and the IRS source of the definition. PR 3 records these from IRS guidance.
2. **No substitution.** Salsa never treats deposits, take-home pay, transfers or gross household income as AGI or MAGI, never pre-fills an income answer from bank data, and never shows a deposit total labeled as income.
3. **Ask for the measure itself.** One AGI question appears in My Review > About you, as ranges whose boundaries line up with the thresholds of the rules in scope, plus "Not sure". Help text explains AGI in plain language and notes that last year's return shows last year's figure, which may differ.
4. **MAGI only when it can matter.** For a rule whose MAGI definition adds items to AGI, Salsa asks a short follow-up about those specific items, and only when the answer could change that rule's outcome.
5. **Uncertainty is preserved.**
   - Income conditions are `unknown` until answered.
   - "Not sure" keeps them `unknown`.
   - If the answered range lies entirely on one side of a threshold, the condition is `met` or `not_met` on attested evidence.
   - If the range straddles a threshold, the condition stays `unknown`. If it falls within a phase-out band, the deductible amount is shown as a range.
   - Salsa never resolves uncertainty in the customer's favor or against it by assumption.
6. **Estimates are labeled.** For a tax year in progress, the customer's answer is an estimate; it is labeled as one and can be updated at any time.

Alternatives rejected: pre-filling from deposits (deposits are not AGI or MAGI); asking for gross household income (not the measure any rule uses).

## Consequences

- More opportunities start as Needs your input. Car loan interest, for example, stays there until the customer answers the income question, even when every vehicle condition is met.
- Benefit estimates require an AGI range ([ADR 0008](0008-deduction-amounts-are-not-tax-savings.md)).
- A test asserts that no rule evaluation reads deposit totals as an income measure.
- Income answers are private to the person who gave them ([ADR 0010](0010-ownership-visibility-and-tax-unit-access.md)).
