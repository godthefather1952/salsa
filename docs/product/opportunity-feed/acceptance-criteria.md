# Acceptance criteria

Each criterion is checked by an automated test unless marked *(manual)*. A pull request that implements a section is complete only when its criteria pass.

## Branding (PR 8, PR 10)

- **B1** Changing a tenant's active configuration changes the feature name, colors, font and corner style with no code change and no redeploy.
- **B2** Both sandbox banks render the same components; no component reads the tenant's identity to decide behavior.
- **B3** "Powered by Salsa" appears if and only if `managed.attribution` is `powered_by`, in the footer, in muted text.
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
- **D3** Cards are ordered: Needs your input, then Potential, then Verified; within a group, not-yet-reviewed before reviewed, then larger amounts first (subject to open question Q2).
- **D4** The status filter shows counts and filters the feed; the filter state is announced to screen readers.
- **D5** The comparison card shows the correct outcome state for each persona, and never states a tax saving.
- **D6** Dismissed opportunities do not appear in the feed or in comparison totals.
- **D7** Empty, unavailable and expired states match [journeys](journeys.md) J8.

## Review workflow (PR 7, PR 11)

- **R1** The flow runs Transactions → Questions → Result → Saved, skipping steps with nothing to show, and the step indicator reflects the skipped count.
- **R2** Removing, recategorizing and restoring a transaction persists immediately, changes the opportunity's amount after evaluation, and is audit-logged.
- **R3** Every answer can be changed later; the previous answer is kept as history.
- **R4** "Not sure" is accepted for every question and leaves the related condition unknown or likely.
- **R5** Profile answers given inside a flow appear in My Review > About you and are never asked again.
- **R6** Saving a review is possible in every eligibility status. A reviewed opportunity can remain Potential or Needs information, and a Verified one can be not started (tests for each).
- **R7** Customer actions never set eligibility status directly; only re-evaluation changes it.
- **R8** When an input changes after a review, the review becomes outdated and explains what changed.
- **R9** Dismissed opportunities can be restored to their previous review status.
- **R10** Closing the widget mid-flow loses nothing; reopening resumes at the same step.

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

## Accessibility (PR 9 to PR 11)

- **A1** Zero automated accessibility violations on every view in both sandbox configurations.
- **A2** Journeys J1 to J4 are completable by keyboard only *(manual)*.
- **A3** Journeys J1 to J4 are completable with VoiceOver, TalkBack and NVDA *(manual, at milestone sign-off)*.
- **A4** Every view reflows at 320 px and 400% zoom with no horizontal scrolling.
- **A5** The session warning appears at least 2 minutes before expiry and can extend the session.

## Mobile and performance

- **P1** Every view is usable at 320 px iframe width; primary actions are at least 44 × 44 px.
- **P2** The widget's JavaScript stays under 150 KB compressed.
- **P3** The first view renders within 2 seconds on a mid-range phone over a typical mobile connection *(manual, sandbox)*.
