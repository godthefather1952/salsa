# salsa

Tax deduction finder that banks embed for everyday consumers. See README.md for the product idea and roadmap.

## Stack

TypeScript everywhere, pnpm workspaces + Turborepo, Node 22.
- `apps/api`: Fastify 5, Drizzle ORM, Postgres (PGlite locally and in tests, `pg` for real servers)
- `packages/core`: shared domain types and helpers
- `packages/fixtures`: deterministic fake bank data
- Biome for lint and format, Vitest for tests

## Commands

- `pnpm check` must pass before any commit (lint, typecheck, tests)
- `pnpm format` fixes formatting and import order
- After changing `apps/api/src/db/schema.ts`: `pnpm db:generate --name <what_changed>` and commit the new file in `apps/api/drizzle`. CI fails if the schema and migrations disagree.

## Conventions

- Money is integer cents (`amountCents`). Never add dollars as floats. Use helpers in `@salsa/core`.
- Dates are ISO strings (`2026-03-14`), no time zones.
- Amount sign convention is documented on `TRANSACTION_TYPES` in `packages/core/src/domain.ts`.
- Every table has `tenant_id`; child tables use composite foreign keys that include it. Keep that pattern for new tables.
- `truthCategory` on generated transactions is a test answer key. Never store it or let the categorizer read it.
- Fixtures describe what a bank sees. Tax rules do not belong in fixtures.
- Tax rules are per tax year, with a source link (IRS page or publication) next to every number.
- Anything shown to customers is labeled an estimate, not tax advice.
- Use only fictional banks, people and merchants in fixtures and demos.
- Workspace packages export TypeScript source (no build step). The API build bundles them with tsup.
