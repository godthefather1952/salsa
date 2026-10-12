# 0009. Asking for income as a pre-filled range

- Status: Proposed
- Date: 2026-10-12

## Context

Several rules depend on income: the medical expense floor, income limits on the car loan interest and senior deductions, and any benefit estimate. Banks see take-home deposits, not adjusted gross income, and see nothing from other banks or employers.

## Decision

Ask one profile question, "About how much did your household earn this year, before taxes?", as a choice of ranges. Pre-select a suggestion derived from deposits, clearly labeled as a suggestion. "Not sure" is always available.

Alternatives considered: asking for last year's adjusted gross income (precise but harder to answer); inferring silently (no friction but hides a guess inside results).

## Consequences

- Income-dependent conditions stay `likely` (Potential) until the customer answers, and become `met` or `not_met` after.
- The answer is reused across all opportunities; customers are never asked twice.
