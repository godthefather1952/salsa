# Open design questions

Decisions the product owner still needs to make. Each lists the options and engineering's recommendation. The specification uses the recommendation until decided.

| # | Question | Options | Recommendation |
| --- | --- | --- | --- |
| Q1 | Customer-facing status labels | (a) Verified / Potential / Needs your input; (b) Confirmed by your records / May apply / Needs your input | (a), with "Verified" always explained as "meets the rules we can check" |
| Q2 | Feed order | (a) By next action: Needs your input, Potential, Verified; (b) Largest amounts first | (a): it leads customers to the step that changes the most |
| Q3 | Where the standard-vs-itemizing comparison lives in the first build | (a) Top of Discover; (b) Summary only (Phase 3) | (a): it is the most important answer for most customers |
| Q4 | Where the estimated tax effect appears | (a) Summary only, Phase 3; (b) Also on opportunity detail in the first build | (a): keeps the first build free of tax-effect figures while the estimate method is validated |
| Q5 | Show items Salsa checked and ruled out | (a) Collapsed "Checked, doesn't apply" list with reasons; (b) Hide | (a): shows the work and builds trust |
| Q6 | Ask why an opportunity is dismissed | (a) Optional reason (not relevant, already claimed elsewhere, incorrect, other); (b) No reason | (a), optional and skippable |
| Q7 | Bank entry points (open straight to an opportunity, for example from a bank notification) | (a) Supported in Phase 2 through the session request; (b) Later | (b): Discover-first for now; design keeps room for it |
| Q8 | Tax year shown January to April | (a) Previous year by default, switcher visible; (b) Current year by default | (a): that is the year customers are filing |
| Q9 | Dark appearance | (a) Follow the host's preference in Phase 2; (b) Light only for now | (b), with tokens ready for dark later |
| Q10 | Font allowlist | Public Sans, Atkinson Hyperlegible, Source Sans 3, system fonts | Approve this list; add others on request |
| Q11 | Languages | (a) English only in Phase 2; (b) English and Spanish | (a), with all text in a message catalog so Spanish is a translation task |
| Q12 | Native mobile apps (webviews) | (a) Banks register an origin for their webview host; (b) A separate app embedding mode | Decide with the first bank's mobile team; Phase 2 assumes (a) |
| Q13 | Documents (charity acknowledgments, Form 1098-E) | (a) List what to keep, no upload in Phase 2; (b) Upload in Phase 2 | (a): secure document storage is its own project |
| Q14 | Attribution format | (a) Plain text "Powered by Salsa"; (b) A link to Salsa's privacy page | (a); privacy disclosures belong in the bank's own notices |
| Q15 | Recategorize choices | (a) Short context-specific options ("A purchase, not a gift", "Not a medical cost", "Something else", "Not sure"); (b) The full category list | (a): faster and less error-prone on mobile |

## Proposed decision records awaiting approval

These came from the Phase 2 plan and are marked Proposed in [decisions](../../decisions/README.md):

- [0003](../../decisions/0003-finding-status-derived-from-evidence.md): how status is derived from evidence strength
- [0006](../../decisions/0006-controlled-embedding-and-sessions.md): the embedding and session-refresh mechanism
- [0008](../../decisions/0008-deduction-amounts-are-not-tax-savings.md): the tax-effect estimate method
- [0009](../../decisions/0009-income-information.md): income as a pre-filled range
- [0010](../../decisions/0010-parties-and-account-holders.md): parties, account holders and tax units
- [0011](../../decisions/0011-saved-review-snapshots.md): saved engine evaluations
- [0012](../../decisions/0012-2026-rule-scope.md): rule scope for 2026
