# Advisor ledger

Every Venice call made for Salsa, with a worst-case cost bound. Rules: [ADR 0014](decisions/0014-second-opinion-advisor.md). Budget: **$5.00** cumulative.

Bound per call = (input characters ÷ 3) × input price + maximum completion tokens × output price, using prices from Venice's pricing page at the time of the call. Where Venice returned actual usage, the actual figure is used instead.

| Date | PR | Purpose | Tool | Model | Basis | Cost (USD) | Cumulative bound (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-12 | none | Connection test: one-sentence generic question, no project data | `venice_chat` | default (`venice-uncensored`; priced as Venice Uncensored 1.2, $0.20 / $0.90 per million) | Actual usage: 1,758 input, 35 output tokens | 0.0004 | 0.0004 |
| 2026-10-12 | none | Connection test: same question | `venice_responses` | default | Bound: about 1,800 input tokens, 80 output tokens maximum | 0.0005 | 0.0009 |

Remaining budget (worst case): **$4.99**.

The product owner can check actual spend in the Venice account's usage page; this ledger is an upper bound, not an invoice.
