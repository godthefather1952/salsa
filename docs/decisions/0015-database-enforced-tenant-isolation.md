# 0015. Database-enforced tenant isolation in Phase 2

- Status: Accepted
- Date: 2026-10-12
- Second opinion: raised by the Venice review of PR 1 (see the [advisor ledger](../advisor-ledger.md)); validated by engineering; accepted by the product owner with the requirements below.

## Context

Tenant isolation rested on two layers: every query filters by the tenant and person from the signed token, and composite foreign keys stop rows from being linked across tenants. Composite keys prevent cross-tenant links; they do not prevent a read that forgets its tenant filter. Row-level security was planned for Phase 4. Adding it after the review API exists would mean reworking every data-access path, which is more expensive and riskier than building on it from the start.

## Decision

Postgres row-level security is implemented in **PR 4**, as a third layer alongside the two that remain.

**Requirements.**
1. **Deny without tenant context.** Policies compare `tenant_id` with a transaction-scoped setting (`current_setting('app.tenant_id', true)`). When the setting is absent or empty, the comparison is false and no row is visible or writable.
2. **All tenant-owned tables.** Every table that has `tenant_id` gets `ENABLE` and `FORCE ROW LEVEL SECURITY`, with policies for `SELECT`, `INSERT`, `UPDATE` and `DELETE` (`USING` and `WITH CHECK`). A test fails if any table with a `tenant_id` column lacks them.
3. **Restricted application role.**
   - The API connects as a role that owns no tables and has neither `BYPASSRLS` nor superuser.
   - Migrations and the seed script run as a separate owner role.
   - A test asserts the application role's attributes.
4. **Cross-tenant tests for reads, inserts, updates and deletes.** Each operation against another tenant's rows must return nothing or fail. The tests run with no tenant context, the wrong tenant context, and the correct one.
5. **No leakage through connection pooling.**
   - The tenant is set only with `set_config('app.tenant_id', $1, true)` (equivalent to `SET LOCAL`) inside a transaction, so it ends with the transaction.
   - The data-access layer is the only code that opens these transactions.
   - Session-level `SET` is never used.
   - A test runs interleaved requests for different tenants over a pool of one connection and checks that no context carries over.
6. **Separate layers remain.** The central authorization module (deny by default, policy declared per route) and the tenant-scoped data-access layer stay in place (PR 7). Row-level security is defense in depth, not a replacement.

**Testing.** If PGlite cannot exercise these policies with a non-owner role, CI adds a Postgres service container for the isolation tests. GitHub Actions is free for this public repository.

## Consequences

- A forgotten tenant filter returns no rows instead of another bank's data, and a request without tenant context sees nothing.
- Every request runs in a transaction to scope the setting. The cost is small at Phase 2 volumes.
- Phase 4 no longer carries row-level security; it keeps rate limiting and the other bank-readiness work.
