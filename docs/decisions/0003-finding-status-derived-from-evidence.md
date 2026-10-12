# 0003. Three finding classifications, derived from evidence

- Status: Accepted (the three classifications and the merchant-information rule); Proposed (the derivation rules below)
- Date: 2026-10-12

## Context

Customers need to know how much to trust each opportunity. Salsa must never present a transaction as a confirmed deduction because of merchant information alone.

## Decision

Every finding has exactly one status:

| Status | Meaning (approved) |
| --- | --- |
| **Verified** | Sufficient information supports the finding under the applicable rules |
| **Potential** | Activity suggests an opportunity, but eligibility needs confirmation |
| **Needs information** | Salsa cannot make a reliable determination without customer input |

Proposed mechanism:

1. Each rule lists its conditions, each with an IRS source.
2. Every piece of evidence has a strength: `authoritative` (lender tax forms, the bank's own records), `attested` (the customer's answers and corrections) or `inferred` (merchant data, descriptions, classifier output, estimates).
3. `inferred` evidence can make a condition `likely` but never `met`.
4. Status is computed, never assigned: any `not_met` condition rules the finding out; otherwise any `unknown` gives Needs information; otherwise any `likely` gives Potential; otherwise Verified.

## Consequences

- The merchant-information rule is enforced structurally and by a test across every rule, not by reviewer discipline.
- Status is explainable: the interface can list each condition and the evidence behind it.
- Verified means "meets the rules Salsa can check with the evidence it has." It is not a guarantee and not IRS approval; customer-facing wording must say so ([content guidelines](../product/opportunity-feed/content-guidelines.md)).
- Ruled-out findings are kept internally with their reason, for audit and for the open question of showing them to customers.
