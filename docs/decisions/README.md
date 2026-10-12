# Architecture decision records

Each record captures one decision: the context, the decision, and its consequences. Records are never rewritten after acceptance; a later record supersedes an earlier one instead.

**Statuses**
- **Accepted**: approved by the product owner.
- **Proposed**: recommended by engineering, awaiting the product owner's approval.
- **Superseded**: replaced by a later record.

All fifteen records were accepted by the product owner on 2026-10-12; 0003, 0008, 0009, 0010 and 0015 with refinements or requirements recorded in their text.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-bank-first-white-label.md) | Bank-first white-label branding | Accepted |
| [0002](0002-separate-classification-from-tax-rules.md) | Classification is separate from tax rules | Accepted |
| [0003](0003-finding-status-derived-from-evidence.md) | Three finding classifications, derived from evidence | Accepted |
| [0004](0004-customer-review-separate-from-engine-status.md) | Customer review is separate from engine status | Accepted |
| [0005](0005-branding-configuration-is-data.md) | Branding configuration is validated data, never code | Accepted |
| [0006](0006-controlled-embedding-and-sessions.md) | Controlled embedding and session handling | Accepted |
| [0007](0007-ai-classification-seam-only.md) | No AI in Phase 2; an interface for it later | Accepted |
| [0008](0008-deduction-amounts-are-not-tax-savings.md) | Deduction amounts are never shown as tax savings | Accepted |
| [0009](0009-income-information.md) | Rule-specific income measures, never inferred from deposits | Accepted |
| [0010](0010-ownership-visibility-and-tax-unit-access.md) | Ownership, visibility and tax unit access are separate permissions | Accepted |
| [0011](0011-saved-review-snapshots.md) | Saved engine evaluations | Accepted |
| [0012](0012-2026-rule-scope.md) | Rule scope for tax year 2026 | Accepted |
| [0013](0013-development-workflow.md) | Development workflow | Accepted |
| [0014](0014-second-opinion-advisor.md) | Second-opinion AI advisor (Venice) | Accepted |
| [0015](0015-database-enforced-tenant-isolation.md) | Database-enforced tenant isolation in Phase 2 | Accepted |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```
