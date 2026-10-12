# 0010. Ownership, visibility and tax unit access are separate permissions

- Status: Accepted
- Date: 2026-10-12 (accepted with refinements the same day)

## Context

The current schema gives each account one customer and treats one bank customer as one tax return. Real households do not fit: joint accounts, spouses who bank elsewhere, authorized users, and later businesses. Tax information is also among the most private information a person has. Being married to someone, or sharing a checking account with them, must not by itself reveal one person's answers, income or medical information to the other.

## Decision

Salsa models three separate permissions, each with its own source and its own record.

| Permission | Question it answers | Source | Record |
| --- | --- | --- | --- |
| **Ownership** | Who legally holds this account, in what role? | The bank | `account_holders`: party, account, role (owner, joint owner, authorized user, signer) |
| **Visibility** | Which accounts may this person see in Salsa? | The bank's entitlements | `account_visibility_grants`: party, account, granted at, revoked at |
| **Tax unit access** | Whose tax information does this person share a review with? | Each member's own explicit consent | `tax_unit_members`: tax unit, party, status, sharing scopes, consent timestamp and session |

Rules:

1. **Parties.** A party is a person or, later, a business. The widget session identifies one person.
2. **Visibility is explicit.** Salsa shows an account only to a party with an active visibility grant, even if that party owns it. Ownership alone does not grant visibility, and visibility does not imply ownership.
3. **Private by default.** Every person starts in their own individual tax unit. Their answers, transaction decisions, dismissals, reviews and income information belong to them.
4. **Shared tax units require consent from each member.** Joining a shared tax unit (for example, to review a joint return together) requires an invitation and each member's own acceptance, recorded with time and session. Either member can leave at any time. Sharing scopes say what is shared (for example, opportunities from jointly held accounts, or answers in a category). Nothing is shared retroactively without consent.
5. **No automatic exposure.** Marriage, a "married filing jointly" answer, or joint account ownership never by itself grants access to another person's private tax information or creates a shared tax unit. A married-filing-jointly answer only lets the person describe their spouse's information themselves, or invite the spouse if the spouse is a customer of the same bank.
6. **Joint accounts.** Each joint owner with a visibility grant sees the account's transactions, as they already can in online banking. Each person's decisions and answers about those transactions remain their own unless shared through a tax unit scope.
7. **Authorization order on every request:** tenant, then party (from the token), then account visibility, then tax unit membership and sharing scope.

## Consequences

- PR 4 adds parties, account holders, visibility grants, tax units and tax unit membership. PR 7 enforces the authorization order in every endpoint.
- Phase 2 builds individual tax units. The shared tax unit invitation experience is designed and built in Phase 3, on the model created now.
- Fixtures gain Daniel Brooks, Maya's spouse: a separate customer and joint owner of their checking account, with his own private answers. Tests prove that neither sees the other's private information without a shared tax unit.
- Business support later adds business parties and business tax units with no structural change.
