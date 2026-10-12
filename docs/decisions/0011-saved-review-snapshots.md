# 0011. Saved engine evaluations

- Status: Accepted
- Date: 2026-10-12

## Context

A bank, a regulator or the customer may later ask what Salsa showed on a given date and why. Results computed on each request cannot answer that, and rules change between tax years and versions.

## Decision

- Every engine run that a customer sees is saved as an evaluation: rules version, engine version, inputs fingerprint, timestamp, and its findings.
- Customer reviews reference the evaluation they signed off on.
- Evaluations are immutable. A new run creates a new evaluation.

## Consequences

- Storage grows with usage; old evaluations can be archived by policy (retention period to be agreed with banks).
- "Outdated review" detection compares fingerprints cheaply.
