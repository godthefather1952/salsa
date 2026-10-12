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
    │   │   │       ├── <EligibilityBadge> → <StatusExplainer>
    │   │   │       ├── <ReviewStatusChip>
    │   │   │       ├── <Explanation>
    │   │   │       ├── <EvidenceLine>
    │   │   │       └── <PrimaryAction>
    │   │   ├── <RuledOutList>       collapsed "Checked, doesn't apply"
    │   │   └── <EmptyState>
    │   ├── <OpportunityDetailView>
    │   │   ├── <DetailHeader>       category, amount, both statuses
    │   │   ├── <StatusExplainer>    what this status means
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
    │   │   ├── <QuestionsStep> → <QuestionField> × n   includes <IncomeRangeQuestion>
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
| Verified | Check in circle | Verified | The information we can review supports this deduction under the IRS rules we check. It isn't a guarantee that the IRS will accept it. |
| Potential | Half-filled circle | Potential | Your activity suggests this may apply. Confirm a few details. |
| Needs information | Question mark in circle | Needs your input | We can't tell without more information from you. |

Status is always conveyed by text and icon, never color alone. Status colors are fixed by Salsa (not bank-configurable) and meet contrast requirements on the surface color.

### StatusExplainer

Explains what an eligibility status means, in plain language (refinement R1).

- On cards: the badge has an adjacent "What's this?" control that opens a short disclosure. On the detail view, the explanation is shown in full under the status.
- Verified text: "The information we can review supports this deduction under the IRS rules we check. It isn't a guarantee that the IRS will accept it. Information we can't see, such as accounts at other banks or the rest of your tax return, can change the result."
- Potential text: "Your activity suggests this may apply, but some details can only come from you. Confirming them lets us check the rules fully."
- Needs your input text: "We can't tell whether this applies without information only you have, such as your income or a document from another company."
- Implemented as a native disclosure (button with `aria-expanded`), keyboard operable, never a hover-only tooltip.

### ReviewStatusChip

Visually distinct from the eligibility badge (outlined chip, muted text) so the two states are never confused: "Not reviewed", "In progress", "Reviewed Oct 12", "Needs another look", "Not relevant".

### ComparisonCard and DeductionMeter

- Title: "Standard deduction or itemizing?" with an "Estimate" label and a one-line definition of itemizing on first view.
- Shows one of the comparison states in [states](states.md#6-deduction-comparison): **incomplete**, **provisional** or **complete** (refinement R2). The state name is shown in text ("We can't recommend one yet", "Provisional", "Based on your full-year records"), not only implied.
- **Incomplete**: no leaning is shown, the meter shows only what is known (with unknown portions drawn as an open, dashed range), and the card lists what is missing, with one action for the item that would decide it.
- **Provisional** and **complete**: the meter shows the standard deduction range and the itemized range (Verified solid, unconfirmed patterned) on the same scale, and one sentence states the leaning and what it is based on.
- Patterns and text, not only color, distinguish verified, unconfirmed and unknown parts.
- Never states a tax saving or a dollar difference as a benefit. The tax effect appears only in Summary (Phase 3).

### ReviewFlow

- `StepIndicator` shows "Step 2 of 4: Questions" in text, with the step list for context. Steps without content are skipped and the count adjusts.
- Every step has Back and a single forward action: "Continue", "See result", "Save review".
- Changes autosave as they happen; the forward action never loses work.

### TransactionRow

Date, merchant or description, account (name and last four), amount. Controls: "Keep" (default, shown as state), "Remove", "Something else…" (opens `RecategorizeSheet`). Removed rows move to `RemovedTransactions` with "Restore".

### QuestionField

One question per field, with the reason it matters ("This decides whether these gifts can be deducted"). Answer types: Yes / No / Not sure, choice of options, currency amount, filing status, income range. "Not sure" is always available and is a valid answer. Previously answered profile questions appear pre-filled with "You told us on Oct 12", editable. Nothing is ever pre-filled from bank data.

### IncomeRangeQuestion

- Asks for the measure the rule uses: AGI in About you; a MAGI follow-up only for rules whose definition can differ, and only when it could change the outcome ([ADR 0009](../../decisions/0009-income-information.md)).
- Range boundaries line up with the thresholds of the rules in scope; options are ranges, plus "Not sure".
- Help text in plain language: what AGI is, that last year's return shows last year's figure (which may differ), and that the answer is an estimate the customer can change.
- Never displays deposit totals, never calls deposits income, never suggests a range.

### RecategorizeSheet

Short, context-specific options (design decision Q15): for giving, "A purchase, not a gift"; for medical, "Not a medical cost"; always "Something else" and "Not sure". A bottom sheet dialog that traps focus while open and returns it on close.

### RuledOutList

Collapsed by default under the feed: "Checked, doesn't apply ({n})". Each item shows the category and the plain reason ("Your car loan is for a used vehicle; this deduction is for new vehicles"). No amounts are emphasized and there is no action other than viewing the detail.

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

Tokens become CSS custom properties on the widget root. Only the keys above exist; configuration cannot add properties. Phase 2 ships the light appearance only; neutral and status tokens are defined so a dark set can be added later (design decision Q9).

## Text

All customer-facing text lives in a message catalog keyed by message id, with the configured feature name and bank name as parameters. Phase 2 ships English (`en-US`); other languages are a translation task (design decision Q11). Action labels come only from the catalog's approved action list.
