# Content guidelines

## Amounts are not savings

- Label every amount with what it is: "Interest paid", "Given so far in 2026", "Medical costs paid", "Paid to County Tax Commissioner".
- Never use "save", "savings", "refund", "money back", "you'll get" or "you'll keep" with an amount, a deduction or an opportunity.
- The tax effect appears only as "Estimated effect on your federal income tax", as a range, with its assumptions, and only when calculable ([ADR 0008](../../decisions/0008-deduction-amounts-are-not-tax-savings.md)).
- A CI check scans widget strings and fails on these words in amount labels, explanations, evidence lines and comparison text. Action labels come from the fixed list in [components](components.md), so "Save review" (saving your work) stays allowed.

## Certainty

- Use the status vocabulary exactly: Verified, Potential, Needs your input.
- Use "can" and "may", not "will": "Gifts to churches and registered charities can be deducted."
- Verified means eligibility is supported by the information Salsa can evaluate, not guaranteed IRS acceptance. Every Verified badge offers this explanation, and it is shown in full on the detail view:
  > The information we can review supports this deduction under the IRS rules we check. It isn't a guarantee that the IRS will accept it. Information we can't see, such as accounts at other banks or the rest of your tax return, can change the result.
- Never use "approved", "guaranteed", "certified", "confirmed by the IRS" or "IRS-verified".
- Explain why Salsa thinks something, from the evidence: "Based on 12 payments to 2 organizations", "From your mortgage records at Tidewater Demo Bank", "You told us on Oct 12".

## Comparison

- Say which state the comparison is in, in words: "We can't recommend one yet", "Provisional", "Based on your full-year records".
- When incomplete, say what is missing and offer the one item that would decide it. Never show a leaning the bounds do not support.
- When provisional, say what it is based on and that it can change: "Based on what we've verified so far, itemizing looks larger. This can change if any of these items change."
- During the year, never lean toward the standard deduction; describe the facts instead: "So far, your itemizable amounts are below the standard deduction, and the rest of the year can change that."
- After the year, name the limits of what Salsa can see: "Deductible expenses paid from other banks could change this."
- Never describe the difference between the two totals as a saving.

## Income

- Name the measure the rule uses: "adjusted gross income (AGI)", or the provision's "modified adjusted gross income (MAGI)", with a plain-language explanation on first use.
- Never call deposits, paychecks or balances "income", and never present a deposit total as an estimate of AGI or MAGI.
- Never suggest or pre-select an income range.
- Label answers for a year in progress as estimates: "Your estimate. You can change it any time."
- When an income answer can't settle a rule, say so: "Your range includes the income limit for this deduction, so we can't tell yet whether it applies."

## Privacy

- Never mention a spouse's or joint owner's answers, income or decisions unless that person has shared them through a shared tax unit.
- On joint accounts, refer to the account, not the other person: "From your joint checking ending 3695".

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
