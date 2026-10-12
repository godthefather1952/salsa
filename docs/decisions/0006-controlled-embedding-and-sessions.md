# 0006. Controlled embedding and session handling

- Status: Accepted (requirements: tenant isolation, authenticated sessions, controlled embedding); Proposed (mechanism below)
- Date: 2026-10-12

## Context

Today any website can load the widget in an iframe, the widget posts messages to any parent (`*`), and fonts load from a third-party server. A widget showing financial data must only run inside its bank's pages and must not leak data to anyone else.

## Decision (proposed mechanism)

- **Per-tenant widget URL.** The widget is served at `/embed/{tenantPublicId}/`. The server sets `Content-Security-Policy: frame-ancestors` to that tenant's registered origins, so browsers refuse to render it anywhere else.
- **Token and URL must agree.** The widget rejects a session token whose tenant differs from the URL's tenant.
- **Origin-restricted messaging.** The widget sends `postMessage` only to the tenant's registered origins. The bank page checks `event.origin` and `event.source`.
- **Session refresh.** Two minutes before the 15-minute token expires, the widget asks the bank page for a new token. The bank page requests one from its own server, which calls Salsa with the bank's API key. If refresh fails, progress is already saved and the widget offers to reload.
- **No third-party requests.** Fonts and assets are self-hosted. No analytics in Phase 2.
- **Strict content security policy** on the widget: scripts, styles, fonts and connections from Salsa's own origin only.

## Consequences

- Banks register their origins during onboarding; the sandbox registers `http://localhost:4000`.
- Native mobile apps that load the widget in a webview need a registered origin or an app-specific embedding mode (open question).
- Session refresh adds one message type to the host integration, documented for bank engineers.
