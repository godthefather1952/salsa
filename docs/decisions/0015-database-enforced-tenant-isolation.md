# 0015. Database-enforced tenant isolation in Phase 2

- Status: Proposed
- Date: 2026-10-12
- Second opinion: raised by the Venice review of PR 1 (see the [advisor ledger](../advisor-ledger.md)); validated by engineering.

## Context

Tenant isolation today rests on two layers: every query filters by the tenant and person from the signed token, and composite foreign keys stop rows from being linked across tenants. Composite keys prevent cross-tenant writes that link rows; they do not prevent a read that forgets its tenant filter. Postgres row-level security was planned for Phase 4. Adding it after the review API exists would mean reworking every data-access path, which is more expensive and riskier than building on it from the start.

## Decision (proposed)

- **One data-access layer.** From PR 7, route handlers never query tables directly. Every query runs through a data-access layer that requires a tenant context (tenant id and party id from the verified token). A lint or test check fails if a route module imports table definitions.
- **Row-level security from PR 4.**
  - Every tenant-scoped table gets a policy restricting rows to `current_setting('app.tenant_id')`.
  - The API connects as a role that does not own the tables, so the policies cannot be bypassed.
  - The data-access layer sets the tenant for each transaction (`SET LOCAL`).
  - Migrations and the seed script run as the owner role.
- **Tested for real.** If PGlite cannot exercise the policies with a non-owner role, CI adds a Postgres service container for the isolation tests. GitHub Actions is free for this public repository.

## Consequences

- A forgotten tenant filter returns no rows instead of another bank's data.
- Every request needs a transaction to scope the setting. The cost is small at Phase 2 volumes.
- Phase 4 no longer carries row-level security; it keeps rate limiting and the other bank-readiness work.
- If not accepted, Phase 2 keeps the data-access layer (a routine change) and row-level security stays in Phase 4.
