# Acceptance criteria

Each criterion is checked by an automated test unless marked *(manual)*. A pull request that implements a section is complete only when its criteria pass.

## Branding (PR 8, PR 10)

Unchanged by the refinements (R5): bank-first branding and a subtle "Powered by Salsa" attribution, exactly as specified.

- **B1** Changing a tenant's active configuration changes the feature name, colors, font and corner style with no code change and no redeploy.
- **B2** Both sandbox banks render the same components; no component reads the tenant's identity to decide behavior.
- **B3** "Powered by Salsa" appears if and only if `managed.attribution` is `powered_by`, as plain text in the footer, in muted text.
- **B4** The configured feature name is the widget's heading, and the demo bank uses it as the iframe title and navigation label.
- **B5** No Salsa name or logo appears anywhere else in the interface.

## Configuration safety (PR 8)

- **C1** Configurations with unknown keys, HTML or template characters in text, invalid colors, non-https or off-host links, or remote resource URLs are rejected with field-level errors.
- **C2** A primary color below 4.5:1 contrast is rejected.
- **C3** Configuration reaches the widget only through the session bootstrap; URL parameters cannot change it.
- **C4** Every configuration change creates a version and an audit event; activating an earlier version restores it.

## Discover (PR 10)

- **D1** Every opportunity card shows category, a labeled amount, an explanation, an evidence source, an eligibility badge and exactly one primary action.
- **D2** No amount label, explanation, evidence line or comparison sentence contains "save", "saving", "refund" or "money back" (copy check). Action labels come only from the approved list in [components](components.md).
- **D3** Cards are ordered: Needs your input, then Potential, then Verified; within a group, not-yet-reviewed before reviewed, then larger amounts first.
- **D4** The status filter shows counts and filters the feed; the filter state is announced to screen readers.
- **D5** Dismissed opportunities do not appear in the feed or in comparison totals.
- **D6** Ruled-out findings appear only in the collapsed "Checked, doesn't apply" list, each with its plain-language reason and no emphasized amount.
- **D7** From January 1 to April 15 the previous tax year is shown by default with the year switcher visible; only configured tax years are offered.
- **D8** Empty, unavailable and expired states match [journeys](journeys.md) J10.

## Verified meaning (PR 10, refinement R1)

- **V1** Every Verified badge offers "What Verified means" in one step, and the detail view shows it in full, stating that Verified is not a guarantee of IRS acceptance.
- **V2** Customer-facing text never contains "approved", "guaranteed", "certified", "confirmed by the IRS" or "IRS-verified" (copy check).
- **V3** The explanation is a keyboard-operable disclosure, not a hover-only tooltip.

## Deduction comparison (PR 6, PR 10, refinement R2)

- **K1** Each comparison state in [states](states.md#6-deduction-comparison) has a test that produces it and checks its sentence and action.
- **K2** No leaning toward the standard deduction is shown while the tax year is in progress.
- **K3** A leaning is shown only when it holds across the whole standard deduction range and the whole itemized range (property-based test with random unconfirmed items).
- **K4** Every incomplete state names what is missing and, where one exists, offers the item that would decide it.
- **K5** Every state is labeled "Estimate" and never presents the difference between totals as a saving.
- **K6** A married-filing-jointly person in an individual tax unit never sees a standard-deduction leaning; a married-filing-separately person sees no comparison leaning until they answer whether their spouse itemizes.

## Income (PR 3, PR 6, refinement R3)

- **I1** No rule evaluation reads deposits, balances or transfers as AGI or MAGI; income conditions consume only the customer's income answers (test on evaluation inputs).
- **I2** Income questions are never pre-filled or pre-selected, and never display deposit totals.
- **I3** Each income-dependent rule declares its measure (AGI or that provision's MAGI) with an IRS source; a test per rule checks both.
- **I4** A range entirely on one side of a threshold settles the condition; a range straddling it, or "Not sure", leaves it unknown.
- **I5** A range within a phase-out band produces a deductible amount range, never a single figure.

## Review workflow (PR 7, PR 11)

- **W1** The flow runs Transactions → Questions → Result → Saved, skipping steps with nothing to show, and the step indicator reflects the skipped count.
- **W2** Removing, recategorizing and restoring a transaction persists immediately, changes the opportunity's amount after evaluation, and is audit-logged.
- **W3** Every answer can be changed later; the previous answer is kept as history.
- **W4** "Not sure" is accepted for every question and leaves the related condition unknown or likely.
- **W5** Profile answers given inside a flow appear in My Review > About you and are never asked again.
- **W6** Saving a review is possible in every eligibility status. A reviewed opportunity can remain Potential or Needs your input, and a Verified one can be not started (tests for each).
- **W7** Customer actions never set eligibility status directly; only re-evaluation changes it.
- **W8** When an input changes after a review, the review becomes outdated and explains what changed.
- **W9** Dismissed opportunities can be restored to their previous review status.
- **W10** Closing the widget mid-flow loses nothing; reopening resumes at the same step.

## My Review (PR 11)

- **M1** Progress reads "{done} of {total} reviewed" per the definition in [states](states.md) and never mentions verification.
- **M2** The lists To review, Needs another look, Reviewed and Not relevant contain exactly the opportunities in those review states.

## Engine guarantees (PR 2, PR 6)

- **E1** For every rule, a finding supported only by inferred evidence is never Verified.
- **E2** Each persona produces its expected findings and statuses (written as tests from the persona descriptions).
- **E3** Every condition shown to customers links to its IRS source.

## Security (PR 7, PR 8)

- **S1** Every widget endpoint rejects tokens for another tenant and never returns another customer's data.
- **S2** The widget is refused by the browser on an unregistered origin (content security policy header present with the tenant's origins).
- **S3** The widget sends and accepts messages only for registered origins.
- **S4** The widget makes no requests to third-party hosts.
- **S5** Tokens are never written to storage, logs or URLs other than the initial fragment.
- **S6** Every token names a server-side widget session; a revoked or unknown session is rejected even before the token expires, and every audit event records the session id.

## Ownership, visibility and tax units (PR 4, PR 7, refinement R4)

- **P1** A person never sees an account without an active visibility grant, even as its owner. A grant without ownership allows seeing; that person's decisions stay their own and never change the owner's review.
- **P2** Joint owners with visibility each see the account's transactions, but never each other's answers, transaction decisions, dismissals, reviews or income (tests with Maya and Daniel).
- **P3** A "married filing jointly" answer, marriage or joint ownership never creates a shared tax unit or shares any data.
- **P4** Sharing starts only after the invited person's own recorded acceptance, covers only the scopes each member chose, and stops the moment either leaves (model tests in Phase 2; interface in Phase 3).
- **P5** Revoking a visibility grant removes the account from that person's views and its evidence from their next evaluation, and marks affected reviews outdated.
- **P6** Every endpoint applies the authorization order: tenant, party, account visibility, tax unit scope.
- **P7** All authorization goes through one module: the server refuses to start if a route has no declared policy, and route handlers read data only through the tenant-scoped data-access layer.
- **P8** A permission matrix test covers every endpoint against other tenant, other person on a joint account, revoked visibility grant, and non-member of a shared tax unit; every combination fails.

## Accessibility (PR 9 to PR 11)

- **A1** Zero automated accessibility violations on every view in both sandbox configurations.
- **A2** Journeys J1 to J4 and J8 are completable by keyboard only *(manual)*.
- **A3** Journeys J1 to J4 and J8 are completable with VoiceOver, TalkBack and NVDA *(manual, at milestone sign-off)*.
- **A4** Every view reflows at 320 px and 400% zoom with no horizontal scrolling.
- **A5** The session warning appears at least 2 minutes before expiry and can extend the session.

## Text (PR 9 to PR 11)

- **T1** Every customer-facing string comes from the message catalog; a lint check rejects hardcoded strings in widget components.

## Mobile and performance

- **N1** Every view is usable at 320 px iframe width; primary actions are at least 44 × 44 px.
- **N2** The widget's JavaScript stays under 150 KB compressed.
- **N3** The first view renders within 2 seconds on a mid-range phone over a typical mobile connection *(manual, sandbox)*.
