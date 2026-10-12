# Phase 2 plan

Goal: a working Opportunity Feed in the sandbox. Customers of both fictional banks can discover tax opportunities, review transactions, answer eligibility questions, see the engine's evaluation and save their review, all under their bank's brand.

## Rules for every pull request

- One pull request per step. Nothing reaches `main` without the product owner's approval and merge.
- A step is complete only when its tests exist and pass, and the existing sandbox flow still works.
- Fictional data only. No paid services. No AI features in Phase 2 ([ADR 0007](../decisions/0007-ai-classification-seam-only.md)).
- Every decision that shapes the architecture gets a decision record in `docs/decisions`.

## Milestones and pull requests

### A. Specification and foundations
| PR | Delivers | Done when |
| --- | --- | --- |
| 1 | This documentation: architecture, decisions, Opportunity Feed specification | Approved by product owner |
| 2 | `packages/tax-engine` skeleton: finding and review types, status derivation, review state machine | Invariant tests pass: merchant-only evidence is never Verified; review status never changes engine status |

### B. Rules and data
| PR | Delivers | Done when |
| --- | --- | --- |
| 3 | `packages/tax-rules`: federal individual rules for 2026 with IRS sources, including each rule's income measure (AGI or that provision's MAGI) | Every figure and income-measure definition has a source link and a test |
| 4 | Bank data model: parties, account holders (ownership), visibility grants, tax units and members (consent and scopes), lender tax records, pending/posted and reversals, customer facts owned by a party; fixtures gain lender records, hard negative cases, and Daniel Brooks (Maya's spouse, joint checking owner, separate customer). Customers become parties (existing ids preserved); row-level security policies and a non-owner API role if [ADR 0015](../decisions/0015-database-enforced-tenant-isolation.md) is accepted | Migrations apply; sandbox still works; fixtures cover the cases listed below; permission model tests pass |

Hard negative fixture cases: purchase at a charity-run thrift store, raffle ticket, refunded donation, county vehicle registration fee, snacks bought at a pharmacy, doctor visit paid from an HSA, church bookstore purchase.

### C. Classification
| PR | Delivers | Done when |
| --- | --- | --- |
| 5 | `packages/categorizer`: deterministic rules (merchant category codes, descriptions, account metadata), reversal netting, own-account transfer detection, a pluggable classifier interface | Scorecard meets the precision target below on fixtures including hard negatives |

### D. Engine
| PR | Delivers | Done when |
| --- | --- | --- |
| 6 | Rule evaluation: findings, information requests, deduction comparison with incomplete, provisional and complete states, benefit estimate method, review progress | Each persona's expected outcome is a passing test; comparison bounds tests pass; no evaluation reads deposits as income |

### E. Integration and platform
| PR | Delivers | Done when |
| --- | --- | --- |
| 7 | Review API: saved evaluations, findings, transaction decisions, answers, reviews, audit events, explicit tax year; four-layer authorization (tenant, party, visibility, tax unit scope) through one authorization module (deny by default, policy declared per route) and a tenant-scoped data-access layer. Server-side widget sessions; token claims become `{tenantId, partyId, sessionId, exp}` | Every endpoint is tested for cross-tenant, cross-person (joint account) and revoked-grant access |
| 8 | Experience configuration and controlled embedding: versioned config, validation, per-tenant `frame-ancestors`, origin-restricted messaging, session refresh, self-hosted fonts | Unsafe configs are rejected; unregistered origins cannot embed |

### F. Customer experience
| PR | Delivers | Done when |
| --- | --- | --- |
| 9 | Design tokens and component primitives | Accessibility checks pass on every primitive |
| 10 | Discover section | Acceptance criteria for Discover pass |
| 11 | My Review section and the review workflow | Acceptance criteria for My Review pass |

### G. Validation
| PR | Delivers | Done when |
| --- | --- | --- |
| 12 | Sandbox walkthroughs per persona, end-to-end tests, screenshots, README | Product owner signs off in the sandbox |

The Summary section is specified now and built in Phase 3.

## Quality targets

- Zero Verified findings resting only on merchant information, enforced by a test across all rules.
- No income condition settled from deposits; income uncertainty preserved (range straddles and "Not sure" stay unknown).
- No comparison leaning that the bounds do not support.
- No private tax information visible across people without a consented shared tax unit.
- The permission matrix test passes for every endpoint; no route registers without a policy.
- Categorizer precision of at least 98% on tax-relevant categories, measured on fixtures that include hard negatives. Recall is reported, not targeted, because false positives are worse than misses.
- Every tax figure traceable to an IRS source.
- Widget passes automated accessibility checks with zero violations and the manual checklist in [accessibility](../product/opportunity-feed/accessibility.md).
- No regression in the existing sandbox flow at any step.
