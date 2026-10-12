# Salsa documentation

Salsa is a white-label financial intelligence service that banks embed in their own online and mobile banking. Phase 2 builds its first module, the **Opportunity Feed**: tax opportunities found in a customer's bank activity, shown to customers under their bank's brand (default feature name: "Tax Opportunities").

## Architecture

- [System overview](architecture/overview.md): components, trust boundaries, current state, known weaknesses
- [Data model](architecture/data-model.md): findings, evidence, facts, reviews, and the tables behind them
- [Phase 2 plan](architecture/phase-2-plan.md): milestones, pull requests, quality targets

## Decisions

[Architecture decision records](decisions/README.md). Each records one decision, its context and its consequences. All fourteen current records are **Accepted**.

The [advisor ledger](advisor-ledger.md) records every second-opinion consultation and its cost bound.

## Product specification: Opportunity Feed

| Document | Covers |
| --- | --- |
| [Overview](product/opportunity-feed/README.md) | Purpose, principles, glossary |
| [Branding](product/opportunity-feed/branding.md) | Bank-first white-label strategy |
| [Information architecture](product/opportunity-feed/information-architecture.md) | Sections and screen hierarchy |
| [Customer journeys](product/opportunity-feed/journeys.md) | The review workflow, persona walkthroughs |
| [Components](product/opportunity-feed/components.md) | Component tree, specifications, design tokens |
| [States](product/opportunity-feed/states.md) | Every state and allowed transition |
| [Configuration](product/opportunity-feed/configuration.md) | What banks can configure, and how it is validated |
| [Content guidelines](product/opportunity-feed/content-guidelines.md) | Wording rules, including amounts versus tax savings |
| [Accessibility](product/opportunity-feed/accessibility.md) | Requirements and how they are tested |
| [Security and integration](product/opportunity-feed/security.md) | Isolation, sessions, embedding, configuration safety |
| [Acceptance criteria](product/opportunity-feed/acceptance-criteria.md) | What "done" means for each part |
| [Design decisions](product/opportunity-feed/design-decisions.md) | Approved design decisions, refinements, and deferred work |
