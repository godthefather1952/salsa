# 0001. Bank-first white-label branding

- Status: Accepted
- Date: 2026-10-12

## Context

Salsa's advantage is distribution through banks: customers get it inside banking they already trust, with no new account. Banks protect their brand closely and expect embedded services to look like their own product.

## Decision

- The customer's bank controls the visible identity: navigation context, theme, and the feature's name.
- The default feature name is **"Tax Opportunities"**. Banks may rename it.
- Salsa appears only as a subtle "Powered by Salsa" attribution. Whether it appears is governed by each bank's branding agreement, not by the bank's own configuration screen.
- Visual differences between banks come from configuration and design tokens. There are no bank-specific code branches.

## Consequences

- The widget has no Salsa logo, colors or product name in its main interface.
- Branding is a validated configuration object ([ADR 0005](0005-branding-configuration-is-data.md)).
- Salsa's brand recognition with consumers will be low by design; Salsa markets to banks.
- The current widget's "Tax savings" wording and "Tax savings by salsa, a partner of …" footer are replaced in PR 10.
