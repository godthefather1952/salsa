# Information architecture

## Sections

| Section | Job | First build |
| --- | --- | --- |
| **Discover** | Show what Salsa found, how sure it is, and the most useful next step | Yes |
| **My Review** | The customer's own work: profile questions, opportunities to review, reviewed and dismissed items, progress | Yes |
| **Summary** | The year at a glance: comparison breakdown, estimated tax effect, documents to keep | Phase 3 |

## Screen hierarchy

```
{Feature name}                           e.g. "Tax Opportunities"
├── Header: feature name, tax year, data-through date
├── Section tabs: Discover | My Review | Summary (when enabled)
│
├── Discover
│   ├── Comparison card            standard deduction vs itemizing
│   ├── Status filter              All · Needs your input · Potential · Verified
│   ├── Opportunity feed           one card per opportunity
│   └── Empty / partial states
│
├── Opportunity detail             reached from any card or review item
│   ├── Amount, category, eligibility status, review status
│   ├── Why we found this          evidence, in plain language
│   ├── What decides eligibility   conditions with their state and IRS source
│   ├── Transactions               preview of the supporting transactions
│   └── One next action, plus "Not relevant to me"
│
├── My Review
│   ├── Progress                   items reviewed out of items to review
│   ├── About you                  profile questions (filing status, income range)
│   ├── To review                  opportunities not started or in progress
│   ├── Needs another look         outdated reviews
│   ├── Reviewed                   saved reviews; open to revisit
│   └── Not relevant               dismissed; restorable
│
├── Review flow                    one opportunity at a time
│   ├── Step 1  Transactions       keep, remove or recategorize each transaction
│   ├── Step 2  Questions          eligibility questions and confirmations
│   ├── Step 3  Result             the engine's evaluation, and what changed
│   └── Step 4  Saved              the customer's saved review
│
└── Summary (Phase 3)
    ├── Comparison breakdown
    ├── Estimated effect on federal income tax (when calculable)
    ├── Documents to keep
    └── Review completion
```

The approved workflow, Discovery → Transaction Review → Eligibility Questions → Engine Evaluation → Saved Review, maps to Discover followed by review flow steps 1 to 4. Steps are skipped when they have nothing to show (for example, mortgage interest from a lender tax form has no transactions to review).

## Navigation rules

- The widget opens on Discover unless the bank's session requests another entry point (see [open questions](open-questions.md)).
- Views change inside the widget without adding browser history entries, so the bank page's back button keeps working as the bank expects. The widget shows its own Back control on every view below the section level.
- Leaving the review flow part-way keeps everything the customer did; the opportunity shows as in progress.
- When an opportunity needs a profile answer (for example income range), the Questions step asks it in place and saves it to the profile. Customers are never sent elsewhere to answer, and never asked the same question twice.
- After saving a review, the customer returns to where they started the flow, with focus on the item they just reviewed.

## Layout

- Mobile first: a single column at 320 px and up, laid out by the iframe's own width (container queries), not the device's.
- Content width is capped at 720 px for readability; wider iframes add side margins.
- Opportunity detail and review flow are full views, not modals. Recategorizing a transaction uses a bottom sheet dialog.
