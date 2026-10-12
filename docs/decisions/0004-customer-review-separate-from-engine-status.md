# 0004. Customer review is separate from engine status

- Status: Accepted
- Date: 2026-10-12

## Context

A customer can finish reviewing an opportunity that remains Potential (for example, they are unsure whether a recipient is a registered charity). A Verified opportunity may never have been looked at by the customer. Treating "the customer reviewed it" as "it is verified" would overstate certainty.

## Decision

- Every opportunity carries two independent states: the engine's **eligibility status** (Verified, Potential, Needs information) and the customer's **review status** (not started, in progress, reviewed, outdated, dismissed).
- Customers influence eligibility only by adding evidence: keeping, excluding or recategorizing transactions, and answering questions. The engine then re-evaluates.
- A saved review records which engine evaluation the customer signed off on.
- Customers can correct, reject and revisit any transaction decision or answer at any time. History is kept.
- If the inputs behind a reviewed opportunity change (new transactions, an edited answer), its review becomes **outdated** and asks for another look.

## Consequences

- The interface always shows both states, with different visual treatments ([components](../product/opportunity-feed/components.md)).
- Annual review progress counts customer reviews, not verifications ([states](../product/opportunity-feed/states.md)).
- Answers and decisions are audit-logged with the session that made them.
