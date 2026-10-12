# Bank configuration

Decision record: [ADR 0005](../../decisions/0005-branding-configuration-is-data.md).

## Schema (version 1)

```ts
interface TenantExperienceConfig {
  schemaVersion: 1;

  /** Settings the bank may edit. */
  bank: {
    featureName: string;                 // default "Tax Opportunities"; plain text, 3 to 32 characters
    locale: 'en-US';                     // more locales later
    theme: {
      colorPrimary: HexColor;            // '#RRGGBB'
      colorOnPrimary?: HexColor;         // derived if omitted
      colorAccent?: HexColor;            // defaults to colorPrimary
      fontFamily: 'system' | 'public-sans' | 'atkinson-hyperlegible' | 'source-sans-3';
      cornerStyle: 'square' | 'soft' | 'round';
    };
    content: {
      introText?: string;                // plain text, up to 240 characters
      disclaimerAddendum?: string;       // plain text, up to 600 characters; appended to the base disclaimer
      helpLink?: { label: string; url: HttpsUrl };  // label up to 40 characters
    };
    sections: {
      myReview: boolean;                 // default true
      summary: boolean;                  // default false until Phase 3
    };
  };

  /** Settings governed by the bank's agreement with Salsa. Not editable by the bank. */
  managed: {
    attribution: 'powered_by' | 'hidden';   // default 'powered_by'
    allowedEmbedOrigins: HttpsOrigin[];     // e.g. ['https://online.tidewater.example']; 1 to 10
    allowedLinkHosts: string[];             // hosts helpLink may point to
    taxYears: number[];                     // years the bank has data for, e.g. [2025, 2026]
  };
}
```

`HexColor` is `#` followed by exactly six hex digits. `HttpsUrl` and `HttpsOrigin` must use `https` (the sandbox allows `http://localhost` only in development builds).

## Validation rules

Validated with a strict schema (Zod) shared by the API and the widget, in `packages/core`.

| Rule | Why |
| --- | --- |
| Unknown keys are rejected at every level | No way to smuggle extra styling or behavior |
| Text fields: plain text only; control characters, `<`, `>` and template syntax are rejected; length limits enforced | No HTML or script injection; layout stays intact |
| Text is rendered as text nodes, never as HTML | Defense in depth if validation is ever bypassed |
| Colors match `^#[0-9A-Fa-f]{6}$` and are written only to the fixed token properties | No CSS injection through color values |
| `colorPrimary` must reach 4.5:1 against white and against `colorOnPrimary`; `colorAccent` 3:1 against the surface | Accessibility for every bank |
| Fonts from the allowlist only, served from Salsa's own origin | No third-party requests; consistent metrics |
| `helpLink.url` host must be in `managed.allowedLinkHosts` | Links only to the bank's own sites |
| No image, logo, script, stylesheet or font URLs anywhere | Nothing remote can be loaded through configuration |

A configuration that fails validation is rejected with field-level messages and never becomes active.

## Storage and delivery

- Table `tenant_experience_configs`: tenant, version, document, status (`draft`, `active`, `retired`), created by, created at. One active version per tenant.
- Every change is a new version and an audit event. Rolling back means activating an earlier version.
- The widget receives the active configuration in its session bootstrap response, scoped by the token's tenant. It never reads configuration from URL parameters or from the host page.
- In Phase 2, configurations are managed through the seed script and a command-line tool. A bank-facing admin screen comes later.

## Sandbox configurations

```json
{
  "schemaVersion": 1,
  "bank": {
    "featureName": "Tax Opportunities",
    "locale": "en-US",
    "theme": { "colorPrimary": "#0B6E6E", "colorAccent": "#F2A541", "fontFamily": "public-sans", "cornerStyle": "soft" },
    "content": { "disclaimerAddendum": "Tidewater Demo Bank does not provide tax advice." },
    "sections": { "myReview": true, "summary": false }
  },
  "managed": {
    "attribution": "powered_by",
    "allowedEmbedOrigins": ["http://localhost:4000"],
    "allowedLinkHosts": ["localhost"],
    "taxYears": [2026]
  }
}
```

Summit Demo Credit Union uses `"featureName": "Tax Center"`, `"fontFamily": "atkinson-hyperlegible"`, `"cornerStyle": "square"` and its own colors, so the sandbox exercises renaming and theming.
