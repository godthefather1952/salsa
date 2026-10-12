# Content guidelines

## Amounts are not savings

- Label every amount with what it is: "Interest paid", "Given so far in 2026", "Medical costs paid", "Paid to County Tax Commissioner".
- Never use "save", "savings", "refund", "money back", "you'll get" or "you'll keep" with an amount, a deduction or an opportunity.
- The tax effect appears only as "Estimated effect on your federal income tax", as a range, with its assumptions, and only when calculable ([ADR 0008](../../decisions/0008-deduction-amounts-are-not-tax-savings.md)).
- A CI check scans widget strings and fails on these words in amount labels, explanations, evidence lines and comparison text. Action labels come from the fixed list in [components](components.md), so "Save review" (saving your work) stays allowed.

## Certainty

- Use the status vocabulary exactly: Verified, Potential, Needs your input.
- Use "can" and "may", not "will": "Gifts to churches and registered charities can be deducted."
- Verified is always explained as "meets the rules we can check", never as approved, guaranteed or IRS-verified.
- Explain why Salsa thinks something, from the evidence: "Based on 12 payments to 2 organizations", "From your mortgage records at Tidewater Demo Bank", "You told us on Oct 12".

## Plain language

- Write for a general audience (about 8th-grade reading level). Short sentences, common words.
- Explain tax terms the first time they appear: "Itemizing means listing your deductions one by one instead of taking the standard deduction."
- Sentence case everywhere. No all-caps labels.
- Actions say what happens: "Review 12 payments", "Save review", "Restore". The same action keeps the same name throughout the flow.
- Errors say what happened and how to fix it. They don't apologize and aren't vague.
- Empty states invite the next step.

## Bank and Salsa names

- Use the configured feature name and the bank's name. Never "Salsa" except in the attribution line.
- Refer to the customer's accounts as theirs at their bank: "your mortgage records at Tidewater Demo Bank".

## Disclaimer

Base text, always shown in the footer:

> Estimates based on your account activity and your answers. Not tax advice. For your situation, consider a tax professional.

The bank's `disclaimerAddendum` follows it as a separate paragraph.

## Formatting

- Currency: `$1,738.00` for record-based amounts; "about $1,700" for estimates.
- Dates: "Oct 12" within the current year in compact contexts, "October 12, 2026" in sentences.
- Counts: numerals ("12 payments").

## No pressure

No countdowns, streaks, badges, confetti or urgency messages. Deadlines are stated plainly when relevant.
