# Security and integration requirements

Decision records: [ADR 0005](../../decisions/0005-branding-configuration-is-data.md), [ADR 0006](../../decisions/0006-controlled-embedding-and-sessions.md).

## Tenant isolation

- Every widget request carries a token naming one tenant and one customer. Every query filters on both, from the token only. Identifiers in URLs or request bodies never widen access.
- The database rejects cross-tenant links through composite foreign keys (in place today); Postgres row-level security is added as a second layer in Phase 4.
- Tests for every endpoint include a cross-tenant attempt that must fail.

## Authenticated sessions

- The bank authenticates the customer. Salsa never handles bank credentials.
- The bank's server requests a widget session with its API key (hashed at rest, revocable, several active keys for rotation).
- Widget tokens last 15 minutes, live only in memory in the widget (never in local storage or cookies), and are refreshed through the host before expiry.
- Every answer, transaction decision and dismissal is recorded with the session that made it.

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
- Application logs never include transaction descriptions, amounts tied to customers, or answers. The audit table holds those, with restricted access.
- No analytics or tracking in Phase 2.
- Retention periods for evaluations, answers and audit events are agreed per bank before production (Phase 4).

## Host integration contract (for bank engineers)

| Message | Direction | Payload |
| --- | --- | --- |
| `salsa:resize` | widget → host | `{ height }` in CSS pixels |
| `salsa:session-expiring` | widget → host | `{ expiresAt }` |
| `salsa:session-refreshed` | host → widget | `{ token }` from the bank's server |
| `salsa:reload` | widget → host | none; host reloads the view |

The widget sends to, and accepts from, the tenant's registered origins only. The host sends to the widget's origin only (never `*`), because `salsa:session-refreshed` carries a token.
