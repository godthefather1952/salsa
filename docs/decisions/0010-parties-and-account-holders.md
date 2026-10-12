# 0010. Parties, account holders and tax units

- Status: Proposed
- Date: 2026-10-12

## Context

The current schema gives each account one customer and assumes one bank customer equals one tax return. Joint accounts, spouses who bank elsewhere, and future business accounts do not fit. Changing this after findings and reviews reference customers would be an expensive migration.

## Decision

- A **party** is a person or (later) a business.
- **Account holders** link parties to accounts, many to many, with a role (primary, joint, authorized user).
- A **tax unit** is one return for one tax year: its filer parties and filing status. Findings belong to a tax unit.
- The widget session still identifies one person; that person sees their tax unit's opportunities, drawn only from accounts they hold at that bank.

## Consequences

- Introduced in PR 4, before findings are persisted.
- A spouse's accounts at the same bank are not shown unless that spouse is also a holder; spouse data elsewhere becomes information requests.
- Business support later adds business parties and a business tax unit type, with no structural change.
