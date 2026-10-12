# 0012. Rule scope for tax year 2026

- Status: Accepted
- Date: 2026-10-12

## Decision

Phase 2 covers federal rules for individuals:

| In scope | Notes |
| --- | --- |
| Standard deduction, with additions for age 65+ and blindness | Needed for the comparison |
| Senior deduction | Age from bank records; income limit uses this provision's MAGI definition ([ADR 0009](0009-income-information.md)) |
| Mortgage interest | Lender records are authoritative |
| Property tax, within the state and local tax cap | Bill payments or escrow records |
| Charitable contributions, for itemizers and for non-itemizers | Recipient qualification needs confirmation; gifts of $250 or more need the organization's written acknowledgment |
| Medical and dental expenses | AGI-based floor from the customer's AGI answer; reimbursed costs excluded |
| Car loan interest (qualified passenger vehicle loans) | New vehicle, US final assembly, personal use, loan date; income limit uses this provision's MAGI definition |
| Student loan interest | Interest amount from the servicer's Form 1098-E when held elsewhere; income limit uses this provision's MAGI definition |

Out of scope for Phase 2: the tips and overtime deductions (banks cannot distinguish them in payroll deposits), state taxes, and business returns.

## Consequences

Each rule, threshold, limit and income-measure definition is added in PR 3 with its IRS source and a test.
