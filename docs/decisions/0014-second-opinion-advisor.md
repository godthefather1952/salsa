# 0014. Second-opinion AI advisor (Venice)

- Status: Accepted
- Date: 2026-10-12

## Context

The product owner wants an independent reviewer for significant decisions, separate from the AI doing the implementation. Venice publishes an official MCP server (`@veniceai/mcp-server`). It is connected through the product owner's Claude desktop app, pinned to version 0.2.0, with the API key kept on the product owner's computer. Nothing about it lives in this repository.

## Decision

**Role.** Venice is an advisor, never an authority. Its output is untrusted advisory material. Neither Claude nor Venice may approve restricted actions on the product owner's behalf.

**When to consult.** Architecture, complex implementation choices, security, and significant product changes. Routine coding does not need a consultation.
- At most **two consultations per pull request**. Prefer one, reviewing the proposed design or implementation. Use the second only to resolve a meaningful technical concern.
- Keep prompts concise.

**Tool.** Use `venice_responses` only. `venice_chat` is not used until its missing-response issue (usage returned without reply text through the computer link) is resolved.

**Model.** `deepseek-v4-pro`, chosen on 2026-10-12. Venice's model catalog lists it with reasoning support, code optimization, a 1,000,000-token context and Venice's "private" privacy designation. It is from a different model family than the implementing AI, which keeps the review independent. Price at selection: $1.65 per million input tokens and $3.30 per million output tokens. Pricing is re-checked against Venice's pricing page before the first consultation of each milestone.

**Budget.** $5 cumulative Venice usage for the project.
- `venice_responses` does not report token usage, so the [advisor ledger](../advisor-ledger.md) records a worst-case cost bound for every call.
- The bound is the estimated input tokens (characters ÷ 3) at the input price, plus the model's maximum completion tokens (32,768) at the output price.
- Before any call that would take the cumulative bound past $5, stop and ask the product owner.
- Never buy credits, top up a wallet, or enable automatic recharge. This budget authorizes no other cost.

**Data sent.** Only public repository documentation, code excerpts and fictional test data. Never API keys, credentials, tokens, `.env` files, customer financial records or session information.

**Verification.** Technical and tax claims from Venice are checked against official documentation, IRS sources and tests before they influence the code.

**Disagreements.** Routine technical disagreements are resolved by engineering without interrupting the product owner. The product owner's explicit approval is required before:
- changing product scope or significant customer-facing behavior
- incurring new spending or introducing paid services
- expanding security permissions or weakening safeguards
- merging pull requests
- deploying or modifying production infrastructure

**Record.**
- Each applicable pull request includes a short "Second opinion" section: the model, the number of consultations, the cost bound, Venice's main recommendations, and what was accepted or rejected and why.
- Architectural decisions influenced by a consultation note it in their decision record.

## Consequences

- Consultations add a small, bounded cost: roughly $0.11 worst case per call at current prices, and far less in practice.
- Reviews depend on the product owner's computer being linked to the session. When it is not, work continues without a second opinion, and the pull request says so.
