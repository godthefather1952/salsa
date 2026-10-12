# 0003. Three finding classifications, derived from evidence

- Status: Accepted
- Date: 2026-10-12 (accepted with refinements the same day)

## Context

Customers need to know how much to trust each opportunity. Salsa must never present a transaction as a confirmed deduction because of merchant information alone, and must never imply a result the IRS has not made.

## Decision

Every finding has exactly one status:

| Status | Meaning |
| --- | --- |
| **Verified** | Eligibility is supported by the information Salsa can evaluate under the applicable rules. It is not a guarantee that the IRS will accept the deduction. |
| **Potential** | Activity suggests an opportunity, but eligibility needs confirmation. |
| **Needs information** | Salsa cannot make a reliable determination without customer input. |

Mechanism:

1. Each rule lists its conditions, each with an IRS source.
2. Every piece of evidence has a strength: `authoritative` (lender tax forms, the bank's own records), `attested` (the customer's answers and corrections) or `inferred` (merchant data, descriptions, classifier output, estimates Salsa makes).
3. `inferred` evidence can make a condition `likely` but never `met`.
4. Conditions that depend on income stay `unknown` until the customer supplies the income measure the rule requires, and stay `unknown` when the answer cannot settle the condition ([ADR 0009](0009-income-information.md)).
5. Status is computed, never assigned: any `not_met` condition rules the finding out; otherwise any `unknown` gives Needs information; otherwise any `likely` gives Potential; otherwise Verified.

## Explaining Verified to customers

Every Verified badge offers a short explanation, reachable in one step from the card and shown in full on the detail view:

> **What Verified means.** The information we can review supports this deduction under the IRS rules we check. It isn't a guarantee that the IRS will accept it. Information we can't see, such as accounts at other banks or the rest of your tax return, can change the result.

The words "approved", "guaranteed", "certified", "confirmed by the IRS" and "IRS-verified" are never used.

## Consequences

- The merchant-information rule is enforced structurally and by a test across every rule, not by reviewer discipline.
- Status is explainable: the interface lists each condition and the evidence behind it.
- Income-dependent opportunities show Needs your input until the customer answers the relevant income question (for example, car loan interest).
- Ruled-out findings are kept with their reason and shown in a collapsed "Checked, doesn't apply" list (design decision Q5).
