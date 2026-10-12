# 0002. Classification is separate from tax rules

- Status: Accepted
- Date: 2026-10-12

## Context

Whether a purchase is deductible depends on the person, the tax year, the return type and facts a bank cannot see. The same fuel purchase is nothing on a personal return and may be a business expense on Schedule C. Mixing "what is this?" with "is it deductible?" would make both harder to test and would block business features later.

## Decision

- `packages/categorizer` answers only "what is this transaction?" Its categories describe spending ("payment to a religious organization", "pharmacy purchase"), never tax treatment.
- `packages/tax-rules` holds IRS rules per tax year, jurisdiction and taxpayer type, each with its source.
- `packages/tax-engine` combines classifications, bank records, tax records and customer facts with the rules to produce findings.
- Categorizer output is always `inferred` evidence ([ADR 0003](0003-finding-status-derived-from-evidence.md)).

## Consequences

- The categorizer can be measured on its own against fixture answer keys.
- A new tax year or a new return type (business, state) adds rules without changing the categorizer.
- Some categories exist only to rule things out (for example "thrift store purchase"), because avoiding false positives is a priority.
