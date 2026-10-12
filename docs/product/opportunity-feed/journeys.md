# Customer journeys

Amounts are illustrative, from the sandbox personas part-way through 2026.

## J1. First visit

1. Maya signs in to Tidewater Demo Bank and opens **Tax Opportunities** from the bank's navigation.
2. The bank's server requests a widget session; the page loads the widget. The widget opens on **Discover**.
3. The comparison card says it needs her filing status to compare her deductions with the standard deduction. Its single action: "Add filing status".
4. Below, the feed shows her opportunities ordered by next action:
   - **Charitable giving**, $1,738.00 given so far in 2026, Potential, "Based on 12 payments to 2 organizations", action "Review 12 payments".
   - **Mortgage interest**, $23,366.25 interest paid, Verified, "From your mortgage records at Tidewater Demo Bank", action "Review details".
   - **Property tax**, $3,700.00 paid, Potential, "Based on 1 bill payment to County Tax Commissioner", action "Confirm 1 payment".
5. Nothing is labeled savings. The tax effect appears only later, in Summary, once she has answered the profile questions.

## J2. Reviewing a Potential opportunity (Discovery → Saved Review)

Maya taps "Review 12 payments" on Charitable giving.

1. **Transactions.** Twelve payments are listed by organization, with dates and amounts, all kept by default: ten gifts to Grace Community Church, one to Disaster Relief Fund, and a $38.00 charge from the church's bookstore. She recategorizes the bookstore charge as "A purchase, not a gift". It moves to a "Removed" list she can restore from.
2. **Questions.**
   - For each organization: "Is Grace Community Church a church, or a charity registered with the IRS?" Yes / No / Not sure. She answers Yes for both.
   - "Did you receive anything in return for these gifts, such as goods or event tickets?" She answers No.
3. **Result.** The engine re-evaluates. The status changes from Potential to Verified. The screen explains what changed: "Your answers confirmed the conditions we could not check from your bank records." The amount updates to $1,700.00 because the bookstore charge was removed.
4. **Saved.** She taps "Save review". The opportunity shows "Reviewed by you on Oct 12" alongside its Verified status. My Review progress goes from 0 of 4 to 1 of 4.

## J3. Needs information (an outside servicer)

Sam's feed shows **Student loan interest**, with $3,320.91 in payments to Keystone Student Loan Servicing, Needs information: "Your servicer reports the interest on Form 1098-E. We can only see your payments." Action: "Add interest amount".

1. **Transactions.** Nine payments, all kept.
2. **Questions.** "What is the interest amount on your Form 1098-E (box 1)?" He can enter an amount or choose "I don't have it yet".
3. He chooses "I don't have it yet". **Result:** still Needs information. The screen lists the document to keep.
4. **Saved.** He saves his review anyway. It shows "Reviewed by you", status Needs information, and an open item: "Form 1098-E from Keystone Student Loan Servicing". Review complete is not the same as verified.

## J4. Correcting and rejecting

- **Wrong transaction.** In Ruth's medical review, a pharmacy charge was for groceries. She chooses "Not a medical cost". The charge is removed from the opportunity and stays restorable.
- **Whole opportunity.** Jordan sees Potential charitable giving for a $50 raffle ticket he does not consider a donation. From the detail view he chooses "Not relevant to me" and optionally a reason. The opportunity moves to **My Review > Not relevant**, is excluded from comparison totals, and can be restored.

## J5. Revisiting

- Maya edits her filing status in **My Review > About you**. Every opportunity is re-evaluated. Reviews whose inputs changed move to **Needs another look**, with a note explaining what changed.
- In December, new donations arrive after her review. Her Charitable giving review becomes outdated: "3 new payments since your review". Its action becomes "Review 3 new payments".

## J6. Verified without customer review

Maya's **Mortgage interest** is Verified from lender records before she looks at it. Its action is "Review details". The flow skips Transactions (nothing to review), asks no questions, shows the result, and saves. Verified and reviewed remain separate facts throughout.

## J7. Session expiry

Jordan leaves the review flow open for 14 minutes. The widget warns: "For your security, this view will close in 2 minutes" with "Stay signed in". The bank page refreshes the session and he continues. If refresh is not possible, the widget explains that his answers are saved and offers "Reload", which returns him to the same step.

## J8. Errors and empty states

| Situation | Customer sees | Next action |
| --- | --- | --- |
| No opportunities found | "We haven't found tax opportunities in your {bank} accounts for 2026 yet. We check again as new activity arrives." | "Answer 2 questions" (profile), if unanswered |
| No transactions yet for the tax year | "There's no 2026 activity yet." | Switch to the previous tax year, when available |
| Service unavailable | "{Feature name} isn't available right now. Your accounts aren't affected." | "Try again" |
| Saving an answer fails | Inline: "We couldn't save this answer. Check your connection and try again." | "Try again" (the answer stays in the field) |
| Opened outside the bank's pages | "Open {feature name} from your online banking." | None |
