# 0013. Development workflow

- Status: Accepted
- Date: 2026-10-12

## Decision

- All work happens in separate GitHub pull requests. Nothing is pushed directly to `main` without the product owner's approval.
- A feature is complete only when its tests exist and pass in CI.
- Fictional financial data only, throughout development and demos.
- Important architectural decisions are recorded here as decision records.
- No unnecessary paid services.
- No AI features for novelty ([ADR 0007](0007-ai-classification-seam-only.md)).
- Significant decisions may be reviewed by a second-opinion AI advisor under the rules in [ADR 0014](0014-second-opinion-advisor.md).
- Existing working functionality is preserved; the sandbox must keep working in every pull request.

## Consequences

- The product owner reviews and merges every pull request.
- Recommended repository setting: a ruleset on `main` requiring a pull request and a passing `check` status.
