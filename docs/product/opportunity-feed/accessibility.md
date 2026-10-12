# Accessibility requirements

Target: **WCAG 2.2 Level AA** for every view, in every bank's configuration. Banks are subject to accessibility obligations, and an embedded service that fails them becomes the bank's problem.

## Requirements

### Perceivable
- Text contrast at least 4.5:1; large text and interface components (borders of inputs, focus rings, meter segments, status icons) at least 3:1. Enforced for bank colors at configuration time.
- Status, review state, meter segments and errors are never conveyed by color alone: always text, plus an icon or pattern.
- Content reflows without horizontal scrolling at 320 CSS px wide and at 400% zoom; text spacing overrides do not break layout.
- Amounts are announced fully by screen readers ("one thousand seven hundred thirty-eight dollars"), and every amount has a visible label.

### Operable
- Every action works with a keyboard alone, in a logical order, with no keyboard traps. The recategorize sheet traps focus while open and returns focus to the triggering control when closed.
- Focus is always visible (at least a 2 px outline at 3:1 contrast) and never hidden behind sticky elements.
- Targets are at least 24 × 24 px; primary actions at least 44 × 44 px.
- Section tabs follow the tabs pattern (arrow keys move between tabs).
- Session timing: the customer is warned at least 2 minutes before expiry and can extend with one action. Work is saved so expiry never loses answers.
- No content flashes. Motion is limited to short state transitions and disabled when reduced motion is requested.

### Understandable
- Each view has one heading level 1 (the view title); sections follow in order. The iframe's `title` attribute is the configured feature name (set by the bank page; documented for integrators).
- Questions have visible labels and the reason the question is asked. Errors are identified in text next to the field, with how to fix them, and announced.
- Customers are never asked for the same information twice (profile answers are reused).
- Consistent navigation and naming across all views.

### Robust
- Native elements first (buttons, links, form controls); ARIA only where no native element fits.
- Results of re-evaluation and saving are announced through a polite live region ("Saved. Charitable giving is now Verified.").
- Works with VoiceOver on iOS and macOS, TalkBack on Android, and NVDA on Windows, inside an iframe.

## How it is tested

| Check | When |
| --- | --- |
| Automated rule checks (axe-core) on every component and view, in both sandbox banks' configurations | Every pull request, in CI |
| Configuration contrast validation | When a configuration is saved |
| Keyboard-only walkthrough of J1 to J4 and J8 | Every pull request that changes the interface |
| Screen reader walkthrough of J1 to J4 and J8 (VoiceOver iOS, TalkBack, NVDA) | Before each milestone sign-off |
| 320 px and 400% zoom review | Every pull request that changes layout |

Automated checks find only part of the issues; the manual walkthroughs are required, not optional.
