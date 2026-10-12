# Advisor ledger

Every Venice call made for Salsa, with a worst-case cost bound. Rules: [ADR 0014](decisions/0014-second-opinion-advisor.md). Budget: **$5.00** cumulative.

Bound per call = (input characters ÷ 3) × input price + maximum completion tokens × output price, using prices from Venice's pricing page at the time of the call. Where Venice returned actual usage, the actual figure is used instead.

| Date | PR | Purpose | Tool | Model | Basis | Cost (USD) | Cumulative bound (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-12 | none | Connection test: one-sentence generic question, no project data | `venice_chat` | default (`venice-uncensored`; priced as Venice Uncensored 1.2, $0.20 / $0.90 per million) | Actual usage: 1,758 input, 35 output tokens | 0.0004 | 0.0004 |
| 2026-10-12 | none | Connection test: same question | `venice_responses` | default | Bound: about 1,800 input tokens, 80 output tokens maximum | 0.0005 | 0.0009 |
| 2026-10-12 | 1 | Architecture review of Phase 2 (consultation 1 of 1 authorized). The computer link timed out after 60 s with no reply; the call may have run and been billed | `venice_responses` | `deepseek-v4-pro` ($1.65 / $3.30 per million) | Bound: 6,176 characters (about 2,059 input tokens) + 32,768 output tokens maximum | 0.1115 | 0.1124 |
| 2026-10-12 | 1 | Retry, authorized separately: 2,577-character brief, at most 3 blockers in 250 words, `max_output_tokens` 1,000. Returned in time but incomplete: the reasoning used the whole 1,000-token cap, so only a partial reasoning summary came back and the final answer was empty | `venice_responses` | `deepseek-v4-pro` ($1.65 / $3.30 per million) | Bound: about 859 input tokens + 32,768 output tokens maximum (likely actual: under $0.005, since the 1,000-token cap held) | 0.1095 | 0.2219 |

Remaining budget (worst case): **$4.78**.

The product owner can check actual spend in the Venice account's usage page; this ledger is an upper bound, not an invoice.
