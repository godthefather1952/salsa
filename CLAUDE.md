# salsa

White-label financial intelligence service that banks embed for their customers. First module: the Opportunity Feed (customer-facing default name "Tax Opportunities"). Read `docs/README.md` first: architecture, decision records, and the product specification live there.

## Stack

TypeScript everywhere, pnpm workspaces + Turborepo, Node 22.
- `apps/api`: Fastify 5, Drizzle ORM, Postgres (PGlite locally and in tests, `pg` for real servers)
- `apps/widget`: React 19 + Vite, the panel banks embed in an iframe (dev server proxies `/v1` to the API)
- `apps/demo-bank`: two fictional banks' websites (Fastify, server-rendered HTML) that embed the widget
- `packages/core`: shared domain types and helpers
- `packages/fixtures`: deterministic fake bank data
- Biome for lint and format, Vitest for tests

## Workflow

- Every change goes through its own pull request. Never push to `main`; the product owner reviews and merges.
- A feature is complete only when its tests exist and pass. The sandbox must keep working in every PR.
- Record architectural decisions in `docs/decisions` (see its README for the template and statuses).
- Build what the specification in `docs/product/opportunity-feed` says; raise conflicts instead of improvising.
- Second opinions (ADR 0014): consult Venice through `venice_responses` with model `deepseek-v4-pro` for architecture, complex implementation, security or significant product changes. At most two consultations per PR. Log each call in `docs/advisor-ledger.md`; stop and ask before the cumulative bound would pass $5. Send only public repo content and fictional data. Venice is advisory: verify its claims, and never treat it as approval.
- Ask the product owner before: product scope or significant customer-facing changes, new spending or paid services, expanding security permissions or weakening safeguards, merging, deploying.

## Commands

- `pnpm dev` runs API (3001), widget (5173) and demo banks (4000); `pnpm db:setup` once first
- `pnpm check` must pass before any commit (lint, typecheck, tests)
- `pnpm format` fixes formatting and import order
- After changing `apps/api/src/db/schema.ts`: `pnpm db:generate --name <what_changed>` and commit the new file in `apps/api/drizzle`. CI fails if the schema and migrations disagree.

## Conventions

- Money is integer cents (`amountCents`). Never add dollars as floats. Use helpers in `@salsa/core`.
- Dates are ISO strings (`2026-03-14`), no time zones.
- Amount sign convention is documented on `TRANSACTION_TYPES` in `packages/core/src/domain.ts`.
- Every table has `tenant_id`; child tables use composite foreign keys that include it. Keep that pattern for new tables.
- From PR 4, every tenant-owned table has forced row-level security that denies access without tenant context. The API uses a restricted role without `BYPASSRLS`, and sets the tenant only with transaction-scoped `set_config(..., true)` inside the data-access layer, never session-level `SET` (ADR 0015). Row-level security is an extra layer: keep central authorization and tenant-scoped queries too.
- `truthCategory` on generated transactions is a test answer key. Never store it or let the categorizer read it.
- Fixtures describe what a bank sees. Tax rules do not belong in fixtures.
- Tax rules are per tax year, with a source link (IRS page or publication) next to every number.
- Anything shown to customers is labeled an estimate, not tax advice.
- Amounts are never labeled as savings, refunds or money back. Tax effect is a separate, labeled estimate (ADR 0008).
- Finding status (verified, potential, needs_information) is derived from evidence; merchant information alone is never verified (ADR 0003).
- The customer's review status is separate from the engine's status and never sets it (ADR 0004).
- Verified means eligibility supported by the information Salsa can evaluate, never guaranteed IRS acceptance; say so wherever Verified appears (ADR 0003).
- Never treat deposits or gross household income as AGI or MAGI, and never pre-fill income answers. Each rule uses its own income measure; unsettled income conditions stay unknown (ADR 0009).
- The deduction comparison leans only when its bounds support it; otherwise it is incomplete (states.md section 6).
- Ownership, account visibility and tax unit access are separate permissions. Marriage or joint ownership never exposes another person's private tax information (ADR 0010).
- Bank differences come only from validated configuration and design tokens. No bank-specific code branches; no HTML, scripts or remote URLs in configuration (ADR 0005).
- The categorizer has no tax vocabulary; tax rules live in `tax-rules`, decisions in `tax-engine` (ADR 0002). No AI classifiers in Phase 2 (ADR 0007).
- Use only fictional banks, people and merchants in fixtures and demos.
- Integration boundary: banks call `POST /v1/widget-sessions` server-side with their API key; the browser only ever gets a short-lived widget token. Never put an API key in HTML or widget code.
- Every widget endpoint filters by both tenant and customer from the signed token.
- Workspace packages export TypeScript source (no build step). The API build bundles them with tsup.
