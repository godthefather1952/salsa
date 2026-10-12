# Branding strategy

Decision record: [ADR 0001](../../decisions/0001-bank-first-white-label.md).

## Who controls what

| Element | Controlled by | Notes |
| --- | --- | --- |
| Page header, navigation, logo, app chrome | Bank (its own page) | The widget renders no header logo or navigation outside its own sections |
| Feature name | Bank configuration | Default "Tax Opportunities"; shown as the widget's heading and used as the iframe title |
| Primary color, accent color, font, corner style | Bank configuration | Through design tokens only ([configuration](configuration.md)) |
| Intro text, disclaimer addendum, help link | Bank configuration | Plain text; links to the bank's own domains |
| "Powered by Salsa" attribution | Branding agreement, set by Salsa | Shown by default; hidden only where the agreement allows |
| Status colors and icons, layout, component behavior | Salsa | Consistent across banks so accessibility and meaning are guaranteed |
| Base disclaimer | Salsa | Always shown; banks may append, not remove |

## Attribution

- Text: "Powered by Salsa", plain text, in the footer, in the muted text style. No logo, no link in Phase 2.
- It must never compete with the bank's identity: no color accent, no larger than the smallest body text.
- Its presence is controlled by `managed.attribution` ([configuration](configuration.md)), which banks cannot edit themselves.

## How banks differ visually

Only through tokens: primary color (actions, links, selected section), accent color (progress and highlights, never text), font family from an allowlist, corner style (square, soft, round). Every bank renders the same components in the same layout. There are no bank-specific code branches.

## Sandbox banks

| Bank | Primary | Accent | Feature name |
| --- | --- | --- | --- |
| Tidewater Demo Bank | `#0B6E6E` | `#F2A541` | Tax Opportunities |
| Summit Demo Credit Union | `#3D2C8D` | `#2EC4B6` | Tax Center (to exercise renaming) |

## Migration from the current widget

The current widget calls the feature "Tax savings", shows a two-color strip, and ends with "Tax savings by salsa, a partner of …". All three change in PR 10: the configured feature name replaces "Tax savings", the strip is removed in favor of tokens on interactive elements, and the footer becomes the attribution line.
