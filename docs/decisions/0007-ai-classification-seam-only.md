# 0007. No AI in Phase 2; an interface for it later

- Status: Accepted
- Date: 2026-10-12

## Context

Deterministic rules are free, predictable and testable, and they meet the precision-first goal. AI could later help with merchants the rules cannot place, but sending transaction descriptions to a model provider is a data-sharing decision each bank must approve.

## Decision

- Phase 2 ships deterministic classification only.
- The categorizer exposes a classifier interface so another classifier can be added later without changing callers.
- Any future AI classifier: is opt-in per bank; produces only `inferred` evidence, so it can never make a finding Verified; records its model and version on every result; and is measured on the same scorecard before it is enabled.

## Consequences

- No model provider costs or data-processing agreements in Phase 2.
- Some unusual merchants will stay unclassified. That is acceptable: a missed opportunity is better than a false one.
