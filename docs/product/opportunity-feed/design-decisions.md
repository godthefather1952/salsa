# Design decisions

All design questions raised in the first draft were resolved by the product owner on 2026-10-12. The recommendations were approved, subject to the refinements below, which take precedence where they differ.

## Approved decisions

| # | Question | Decision |
| --- | --- | --- |
| Q1 | Customer-facing status labels | Verified, Potential, Needs your input. Verified is always explained as eligibility supported by the information Salsa can evaluate, not guaranteed IRS acceptance (refinement R1) |
| Q2 | Feed order | By next action: Needs your input, then Potential, then Verified |
| Q3 | Where the standard-vs-itemizing comparison lives | Top of Discover in the first build, with incomplete and provisional states (refinement R2) |
| Q4 | Where the estimated tax effect appears | Summary only, Phase 3 |
| Q5 | Show items checked and ruled out | Yes, in a collapsed "Checked, doesn't apply" list with reasons |
| Q6 | Ask why an opportunity is dismissed | Optional, skippable reason (not relevant, already claimed elsewhere, incorrect, other) |
| Q7 | Bank entry points into a specific opportunity | Later; Discover-first for now, design keeps room |
| Q8 | Tax year shown January to April | Previous year by default, with the switcher visible |
| Q9 | Dark appearance | Light only for now; tokens ready for dark later |
| Q10 | Font allowlist | Public Sans, Atkinson Hyperlegible, Source Sans 3, system fonts |
| Q11 | Languages | English in Phase 2; all text in a message catalog so other languages are a translation task |
| Q12 | Native mobile apps | Banks register an origin for their webview host; app-specific mode decided with the first bank's mobile team |
| Q13 | Documents | List what to keep; no upload in Phase 2 |
| Q14 | Attribution format | Plain text "Powered by Salsa", no link |
| Q15 | Recategorize choices | Short context-specific options ("A purchase, not a gift", "Not a medical cost", "Something else", "Not sure") |

## Refinements

| # | Refinement | Where it is specified |
| --- | --- | --- |
| R1 | Verified means eligibility supported by the information Salsa can evaluate, not guaranteed IRS acceptance, and this is explained clearly to customers | [ADR 0003](../../decisions/0003-finding-status-derived-from-evidence.md), [components](components.md#statusexplainer), [content guidelines](content-guidelines.md#certainty) |
| R2 | The comparison shows an incomplete or provisional state whenever missing information prevents a defensible recommendation | [states](states.md#6-deduction-comparison), [components](components.md#comparisoncard-and-deductionmeter) |
| R3 | Gross household income and deposits are never treated as AGI or MAGI; each rule uses its own income measure; uncertainty is preserved | [ADR 0009](../../decisions/0009-income-information.md), [content guidelines](content-guidelines.md#income) |
| R4 | Ownership, visibility and tax unit access are separate permissions; marriage or joint ownership never automatically exposes another person's private tax information | [ADR 0010](../../decisions/0010-ownership-visibility-and-tax-unit-access.md), [security](security.md#authorization), [states](states.md#9-tax-unit-membership) |
| R5 | Bank-first branding and the subtle "Powered by Salsa" attribution are preserved exactly as specified | [ADR 0001](../../decisions/0001-bank-first-white-label.md), [branding](branding.md) (unchanged) |

## Deferred design work

These are intentionally left for later phases and do not block Phase 2.

| Item | Phase |
| --- | --- |
| Shared tax unit experience: inviting a spouse, accepting, choosing sharing scopes, leaving | Phase 3 |
| Summary section, including the estimated effect on federal income tax | Phase 3 |
| Bank entry points and deep links into a specific opportunity | Phase 3 or later |
| Dark appearance | Later |
| Spanish and other languages | Later |
| Document upload and storage | Phase 3 |
