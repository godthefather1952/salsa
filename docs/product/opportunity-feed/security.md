# Security and integration requirements

Decision records: [ADR 0005](../../decisions/0005-branding-configuration-is-data.md), [ADR 0006](../../decisions/0006-controlled-embedding-and-sessions.md).

## Authorization

Every widget request is authorized in four layers, in this order ([ADR 0010](../../decisions/0010-ownership-visibility-and-tax-unit-access.md)):

| Layer | Rule | Enforced by |
| --- | --- | --- |
| Tenant | The token names one bank; every query filters on it | Token claims, composite foreign keys, Postgres row-level security from PR 4 that denies access without tenant context ([ADR 0015](../../decisions/0015-database-enforced-tenant-isolation.md)) |
| Party | The token names one person; identifiers in URLs or request bodies never widen access | Token claims |
| Account visibility | A person sees an account only with an active visibility grant from the bank, whether or not they own it | `account_visibility_grants`, checked on every account and transaction read |
| Tax unit scope | A person sees another person's answers, decisions, reviews or income only through a shared tax unit both accepted, and only within the scopes the sharing member chose | `tax_unit_members` and sharing scopes |

Ownership, visibility and tax unit access are separate permissions. Marriage, a "married filing jointly" answer or joint account ownership never by itself grants access to another person's private tax information.

All four layers are enforced by one authorization module, never re-implemented per endpoint:

- Every route declares its policy when it is registered. The server refuses to start if a route has none (deny by default).
- Route handlers read data only through the tenant-scoped data-access layer, which requires the verified tenant and party. Row-level security in the database is a further, independent layer from PR 4 ([ADR 0015](../../decisions/0015-database-enforced-tenant-isolation.md)); the authorization module and data-access layer do not rely on it.
- A permission matrix test runs every endpoint against every combination of other tenant, other person on a joint account, revoked visibility grant, and non-member of a shared tax unit. Every combination must fail.

## Authenticated sessions

- The bank authenticates the customer. Salsa never handles bank credentials.
- The bank's server requests a widget session with its API key (hashed at rest, revocable, several active keys for rotation).
- Each widget session is a server-side record (`widget_sessions`: tenant, party, created, expires, revoked). The token carries `{tenantId, partyId, sessionId, exp}`. Every request checks that the session exists and is not revoked, so a session can be ended before its token expires.
- Widget tokens last 15 minutes, live only in memory in the widget (never in local storage or cookies), and are refreshed through the host before expiry. A refresh creates a new session record linked to the previous one.
- Every answer, transaction decision and dismissal is recorded with the person and the session id that made it.
- A bank-facing endpoint to revoke a customer's sessions comes in Phase 4.

## Controlled embedding

| Today | Phase 2 (PR 8) |
| --- | --- |
| Any site can embed the widget | Widget served per tenant with `frame-ancestors` limited to the tenant's registered origins |
| Widget posts messages to `*` | Messages only to registered origins; bank page checks `origin` and `source` |
| Token tenant not compared with page | Widget rejects tokens for a different tenant than its URL |
| Fonts from Google Fonts | Fonts self-hosted; no third-party requests |

Widget content security policy: `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors <registered origins>; base-uri 'none'; form-action 'none'`.

## Configuration safety

Bank configuration can never introduce scripts, HTML, stylesheets or remote resources ([configuration](configuration.md)). Text renders as text; colors map to fixed tokens; links are restricted to the bank's hosts.

## Privacy

- Data minimization: birth year rather than date of birth; no Social Security numbers; no full account numbers (last four only).
- A person's answers, income ranges, decisions and reviews are private to them by default and are never shared with a spouse or joint owner without that person's consent through a shared tax unit.
- Deposit data is never processed into an income figure about the customer.
- Application logs never include transaction descriptions, amounts tied to customers, or answers. The audit table holds those, with restricted access.
- No analytics or tracking in Phase 2.
- Retention periods for evaluations, answers and audit events are agreed per bank before production (Phase 4).
- Any environment holding real customer data uses database storage encrypted at rest. Field-level encryption with per-tenant keys for the most sensitive columns (customer answers, income ranges, medical-related classifications) is evaluated in Phase 4; it needs a key management service, which is a new cost requiring approval. Salsa never stores Social Security numbers.

## Host integration contract (for bank engineers)

| Message | Direction | Payload |
| --- | --- | --- |
| `salsa:resize` | widget → host | `{ height }` in CSS pixels |
| `salsa:session-expiring` | widget → host | `{ expiresAt }` |
| `salsa:session-refreshed` | host → widget | `{ token }` from the bank's server |
| `salsa:reload` | widget → host | none; host reloads the view |

The widget sends to, and accepts from, the tenant's registered origins only. The host sends to the widget's origin only (never `*`), because `salsa:session-refreshed` carries a token.
