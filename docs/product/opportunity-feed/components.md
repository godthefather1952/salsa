# Components and design tokens

Built in `apps/widget` (React 19, Vite) as reusable components driven by design tokens. Bank differences come only from tokens and configuration; components never branch on which bank is showing.

## Component tree

```
<WidgetRoot>                         session, configuration, theme tokens, view state
├── <HostBridge>                     resize, session refresh, reload; origin-restricted
├── <SessionGate>                    loading | expiring | expired | unavailable | no session
└── <AppFrame>
    ├── <FeatureHeader>              feature name, tax year, data-through date
    │   └── <TaxYearSwitcher>        only when more than one year is available
    ├── <SectionTabs>                Discover | My Review | Summary
    ├── <ViewOutlet>
    │   ├── <DiscoverView>
    │   │   ├── <ComparisonCard>
    │   │   │   └── <DeductionMeter>
    │   │   ├── <StatusFilter>
    │   │   ├── <OpportunityFeed>
    │   │   │   └── <OpportunityCard> × n
    │   │   │       ├── <CategoryLabel>
    │   │   │       ├── <AmountFigure>
    │   │   │       ├── <EligibilityBadge>
    │   │   │       ├── <ReviewStatusChip>
    │   │   │       ├── <Explanation>
    │   │   │       ├── <EvidenceLine>
    │   │   │       └── <PrimaryAction>
    │   │   └── <EmptyState>
    │   ├── <OpportunityDetailView>
    │   │   ├── <DetailHeader>       category, amount, both statuses
    │   │   ├── <EvidenceList>
    │   │   ├── <ConditionList> → <ConditionItem> × n
    │   │   ├── <TransactionPreview>
    │   │   ├── <SourceLinks>
    │   │   ├── <PrimaryAction>
    │   │   └── <DismissAction>
    │   ├── <MyReviewView>
    │   │   ├── <ReviewProgress>
    │   │   ├── <ProfileChecklist> → <ProfileQuestionRow> × n
    │   │   ├── <ReviewList title="To review">
    │   │   ├── <ReviewList title="Needs another look">
    │   │   ├── <ReviewList title="Reviewed">
    │   │   └── <ReviewList title="Not relevant">      each → <ReviewListItem>
    │   ├── <ReviewFlow>
    │   │   ├── <StepIndicator>
    │   │   ├── <TransactionReviewStep>
    │   │   │   ├── <TransactionGroup> → <TransactionRow> × n
    │   │   │   ├── <RemovedTransactions>
    │   │   │   └── <RecategorizeSheet>
    │   │   ├── <QuestionsStep> → <QuestionField> × n
    │   │   ├── <ResultStep>
    │   │   │   ├── <StatusChange>
    │   │   │   ├── <WhatChanged>
    │   │   │   └── <OpenItems>
    │   │   └── <SavedStep>
    │   └── <SummaryView>            Phase 3
    ├── <Disclaimer>                 base text + bank addendum
    └── <Attribution>                "Powered by Salsa" when enabled
```

### Primitives

`Button`, `LinkButton`, `Badge`, `Chip`, `Card`, `Tabs`, `Sheet` (dialog), `RadioGroup`, `ChoiceGroup` (Yes / No / Not sure), `CurrencyInput`, `Meter`, `ProgressBar`, `Money`, `DateText`, `Skeleton`, `InlineAlert`, `LiveRegion`, `VisuallyHidden`, `Icon`.

Each primitive owns its accessibility behavior (roles, focus, labels), so composite components inherit it.

## Key component specifications

### OpportunityCard

Shows the six approved elements and one action.

| Element | Content | Example |
| --- | --- | --- |
| Category | Opportunity category name | Charitable giving |
| Amount | `AmountFigure` with a label naming what it is | $1,738.00 given so far in 2026 |
| Explanation | One or two plain sentences from the rule's template | Gifts to churches and registered charities can be deducted. |
| Evidence source | `EvidenceLine`, where the information came from | Based on 12 payments to 2 organizations |
| Eligibility status | `EligibilityBadge` | Potential |
| Next action | `PrimaryAction`, exactly one | Review 12 payments |

Also shown when relevant: `ReviewStatusChip` ("Reviewed Oct 12", "3 new payments since your review").

The whole card is not a link. The category heading links to the detail view and the primary action starts the next step, so screen reader and keyboard users get two clear targets.

**Next action by state**

| Eligibility | Review | Action label |
| --- | --- | --- |
| Needs information | not started / in progress | Answer {n} questions, or Add {document value} |
| Potential | not started / in progress | Review {n} payments, or Confirm {n} payment |
| Verified | not started | Review details |
| any | outdated | Review {n} new payments, or Check what changed |
| any | reviewed | View your review |
| any | dismissed | Restore (in My Review only) |

### AmountFigure

- Label is mandatory and describes the amount: "Interest paid", "Given so far in 2026", "Paid to County Tax Commissioner".
- Exact amounts (from records) show cents. Estimates are prefixed "About" and rounded to whole dollars.
- Never labeled as savings, refund or money back ([content guidelines](content-guidelines.md)).
- Basis is shown on the detail view: "From your Form 1098", "Total of 12 payments", "You told us".

### EligibilityBadge

| Status | Icon | Label | Meaning shown on detail |
| --- | --- | --- | --- |
| Verified | Check in circle | Verified | Your records meet the rules we can check. This isn't a guarantee or IRS approval. |
| Potential | Half-filled circle | Potential | Your activity suggests this may apply. Confirm a few details. |
| Needs information | Question mark in circle | Needs your input | We can't tell without more information from you. |

Status is always conveyed by text and icon, never color alone. Status colors are fixed by Salsa (not bank-configurable) and meet contrast requirements on the surface color.

### ReviewStatusChip

Visually distinct from the eligibility badge (outlined chip, muted text) so the two states are never confused: "Not reviewed", "In progress", "Reviewed Oct 12", "Needs another look", "Not relevant".

### ComparisonCard and DeductionMeter

- Title: "Standard deduction or itemizing?"
- The meter shows two bars on the same scale: the standard deduction for the customer's filing status, and itemizable amounts split into Verified (solid) and Potential (patterned). Patterns, not only color, distinguish the parts.
- One sentence of outcome: "So far, the standard deduction is larger." / "So far, itemizing may give you a larger deduction." / "These are close; your remaining activity will decide." / "Add your filing status to compare."
- Never states a tax saving. The tax effect appears only in Summary.

### ReviewFlow

- `StepIndicator` shows "Step 2 of 4: Questions" in text, with the step list for context. Steps without content are skipped and the count adjusts.
- Every step has Back and a single forward action: "Continue", "See result", "Save review".
- Changes autosave as they happen; the forward action never loses work.

### TransactionRow

Date, merchant or description, account (name and last four), amount. Controls: "Keep" (default, shown as state), "Remove", "Something else…" (opens `RecategorizeSheet`). Removed rows move to `RemovedTransactions` with "Restore".

### QuestionField

One question per field, with the reason it matters ("This decides whether these gifts can be deducted"). Answer types: Yes / No / Not sure, choice of options, currency amount, filing status. "Not sure" is always available and is a valid answer. Previously answered profile questions appear pre-filled with "You told us on Oct 12", editable.

### ResultStep

States the status after evaluation, what changed, and what is still open. Announced through a polite live region.

## Design tokens

### Bank-configurable (through [configuration](configuration.md))

| Token | Used for | Constraint |
| --- | --- | --- |
| `color.primary` | Primary buttons, links, selected tab, focus ring | 4.5:1 against white; and against `color.onPrimary` |
| `color.onPrimary` | Text on primary buttons | Derived (white or near-black) if not set |
| `color.accent` | Progress fill, meter highlight; never text | 3:1 against the surface |
| `font.family` | All text | One of the self-hosted allowlist |
| `shape.corner` | Radius scale | `square` (0/2/4 px), `soft` (4/8/12 px), `round` (8/12/20 px) |

### Fixed by Salsa

| Group | Tokens |
| --- | --- |
| Neutral color | `surface`, `surfaceRaised`, `text`, `textMuted`, `border`, `borderStrong` |
| Status color | `verified`, `potential`, `needsInfo`, each with background, foreground and icon values |
| Feedback | `error`, `success`, `info` |
| Type scale | 14 / 16 / 18 / 20 / 24 / 28 px, line heights 1.5 body, 1.25 headings; base 16 px; weights 400 and 600 |
| Spacing | 4 px grid: 4, 8, 12, 16, 24, 32, 48 |
| Size | Minimum touch target 44 × 44 px for primary actions, 24 × 24 px for any target |
| Motion | 150 ms for state changes; none when reduced motion is requested |
| Breakpoints (container) | compact < 480 px, regular 480 to 767 px, wide ≥ 768 px |

Tokens become CSS custom properties on the widget root. Only the keys above exist; configuration cannot add properties.
