# Opportunity Feed: product specification

- Status: Draft for approval (PR 1)
- Owner: product owner (creative and product decisions); engineering (technical implementation)
- Customer-facing default name: **Tax Opportunities** (configurable per bank)

## Purpose

Help a bank's customers notice tax deductions they might otherwise overlook, using activity the bank already has, and guide them to confirm what applies to them. The feature is part of the bank's own banking experience; the bank is the brand.

## Product principles

1. **The bank is the brand.** Salsa is visible only as an optional "Powered by Salsa" line ([branding](branding.md)).
2. **Honest certainty.** Every opportunity says how sure Salsa is (Verified, Potential, Needs information) and why. Merchant information alone never produces Verified.
3. **Amounts are not savings.** Spending and deduction amounts are labeled as what they are. Tax effect is a separate, clearly labeled estimate shown only when calculable.
4. **The customer stays in control.** Every transaction and answer can be corrected, rejected and revisited. The customer's review is their own record, separate from the engine's status.
5. **Precision over volume.** It is better to miss an opportunity than to show a false one.
6. **One clear next action.** Every opportunity card offers exactly one primary action.
7. **Accessible and mobile-first.** Built for a phone-width iframe first, to WCAG 2.2 AA.

## Scope of the first dashboard

| Section | First implementation |
| --- | --- |
| Discover | Yes |
| My Review (including the review workflow) | Yes |
| Summary | Specified here; built in Phase 3 |

## Glossary

| Term | Meaning |
| --- | --- |
| Opportunity | A finding shown to the customer: a possible deduction with its evidence |
| Eligibility status | The engine's assessment: Verified, Potential or Needs information |
| Review status | The customer's progress on an opportunity: not started, in progress, reviewed, outdated, dismissed |
| Evidence | A record supporting a condition: a lender tax form, a bank record, a transaction, a customer answer |
| Information request | Something Salsa needs from the customer: a question, a confirmation, or a document to keep |
| Profile question | An information request that applies across opportunities (filing status, income range); asked once |
| Evaluation | One saved run of the engine, which a review can reference |
| Host | The bank page or app webview that embeds the widget |

## Documents

[Branding](branding.md) · [Information architecture](information-architecture.md) · [Journeys](journeys.md) · [Components](components.md) · [States](states.md) · [Configuration](configuration.md) · [Content guidelines](content-guidelines.md) · [Accessibility](accessibility.md) · [Security](security.md) · [Acceptance criteria](acceptance-criteria.md) · [Open questions](open-questions.md)
