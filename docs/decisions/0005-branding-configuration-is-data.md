# 0005. Branding configuration is validated data, never code

- Status: Accepted
- Date: 2026-10-12

## Context

Each bank wants its own name, colors and compliance wording. Allowing banks to supply HTML, CSS or scripts would let one configuration mistake, or one compromised bank admin account, inject code into a page that shows financial data.

## Decision

- Bank configuration is a versioned JSON document validated against a strict schema ([configuration](../product/opportunity-feed/configuration.md)). Unknown fields are rejected.
- Text fields are plain text, rendered as text. No HTML, Markdown or templates.
- Colors are `#RRGGBB` values mapped to a fixed list of design tokens. Configurations that fail contrast checks are rejected.
- Fonts come from an allowlist of fonts Salsa hosts itself. No remote font, image or stylesheet URLs.
- Links are `https` only and must point to the bank's registered domains.
- The widget receives configuration from the API in the session bootstrap, never from URL parameters.

## Consequences

- Visual flexibility is deliberately limited to what the tokens allow. That is the point: every bank gets the same tested, accessible components.
- Contract-governed settings (attribution, embedding origins) are separated from bank-editable settings.
- Configuration changes are versioned and audited, so a bank can see and roll back what changed.
