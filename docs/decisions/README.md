# Architecture decision records

Each record captures one decision: the context, the decision, and its consequences. Records are never rewritten after acceptance; a later record supersedes an earlier one instead.

**Statuses**
- **Accepted**: approved by the product owner.
- **Proposed**: recommended by engineering, awaiting the product owner's approval.
- **Superseded**: replaced by a later record.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-bank-first-white-label.md) | Bank-first white-label branding | Accepted |
| [0002](0002-separate-classification-from-tax-rules.md) | Classification is separate from tax rules | Accepted |
| [0003](0003-finding-status-derived-from-evidence.md) | Three finding classifications, derived from evidence | Accepted (classifications); Proposed (derivation rules) |
| [0004](0004-customer-review-separate-from-engine-status.md) | Customer review is separate from engine status | Accepted |
| [0005](0005-branding-configuration-is-data.md) | Branding configuration is validated data, never code | Accepted |
| [0006](0006-controlled-embedding-and-sessions.md) | Controlled embedding and session handling | Accepted (requirements); Proposed (mechanism) |
| [0007](0007-ai-classification-seam-only.md) | No AI in Phase 2; an interface for it later | Accepted |
| [0008](0008-deduction-amounts-are-not-tax-savings.md) | Deduction amounts are never shown as tax savings | Accepted (rule); Proposed (estimate method) |
| [0009](0009-income-information.md) | Asking for income as a pre-filled range | Proposed |
| [0010](0010-parties-and-account-holders.md) | Parties, account holders and tax units | Proposed |
| [0011](0011-saved-review-snapshots.md) | Saved engine evaluations | Proposed |
| [0012](0012-2026-rule-scope.md) | Rule scope for tax year 2026 | Proposed |
| [0013](0013-development-workflow.md) | Development workflow | Accepted |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```
