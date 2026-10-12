# Customer journeys

Amounts are illustrative, from the sandbox personas part-way through 2026.

## J1. First visit

1. Maya signs in to Tidewater Demo Bank and opens **Tax Opportunities** from the bank's navigation.
2. The bank's server requests a widget session; the page loads the widget. The widget opens on **Discover**.
3. The comparison card is **incomplete**: "We can't compare yet. We need your filing status." Its single action: "Add filing status".
4. Below, the feed shows her opportunities ordered by next action:
   - **Charitable giving**, $1,738.00 given so far in 2026, Potential, "Based on 12 payments to 2 organizations", action "Review 12 payments".
   - **Mortgage interest**, $23,366.25 interest paid, Verified, "From your mortgage records at Tidewater Demo Bank", action "Review details".
   - **Property tax**, $3,700.00 paid, Potential, "Based on 1 bill payment to County Tax Commissioner", action "Confirm 1 payment".
5. She adds "Married filing jointly". The card stays **incomplete**, now for a different reason: "We can't compare for a joint return yet. Your spouse's deductible expenses aren't included." It shows her verified and unconfirmed amounts against the standard deduction, without a recommendation. Her spouse's information stays separate unless both of them choose to share (J9), and the rest of the year can still change her own totals.
6. Nothing is labeled savings. The tax effect appears only later, in Summary, once she has answered the profile questions.
7. She taps "What's this?" next to Verified on Mortgage interest and reads that Verified means the information Salsa can review supports the deduction, not that the IRS will accept it.

## J2. Reviewing a Potential opportunity (Discovery → Saved Review)

Maya taps "Review 12 payments" on Charitable giving.

1. **Transactions.** Twelve payments are listed by organization, with dates and amounts, all kept by default: ten gifts to Grace Community Church, one to Disaster Relief Fund, and a $38.00 charge from the church's bookstore. She recategorizes the bookstore charge as "A purchase, not a gift". It moves to a "Removed" list she can restore from.
2. **Questions.**
   - For each organization: "Is Grace Community Church a church, or a charity registered with the IRS?" Yes / No / Not sure. She answers Yes for both.
   - "Did you receive anything in return for these gifts, such as goods or event tickets?" She answers No.
3. **Result.** The engine re-evaluates. The status changes from Potential to Verified. The screen explains what changed: "Your answers confirmed the conditions we could not check from your bank records." The amount updates to $1,700.00 because the bookstore charge was removed.
4. **Saved.** She taps "Save review". The opportunity shows "Reviewed by you on Oct 12" alongside its Verified status. My Review progress goes from 0 of 4 to 1 of 4.

## J3. Needs your input (an outside servicer)

Sam's feed shows **Student loan interest**, with $3,320.91 in payments to Keystone Student Loan Servicing, Needs your input: "Your servicer reports the interest on Form 1098-E. We can only see your payments." Action: "Add interest amount".

1. **Transactions.** Nine payments, all kept.
2. **Questions.** "What is the interest amount on your Form 1098-E (box 1)?" He can enter an amount or choose "I don't have it yet".
3. He chooses "I don't have it yet". **Result:** still Needs your input. The screen lists the document to keep.
4. **Saved.** He saves his review anyway. It shows "Reviewed by you", status Needs your input, and an open item: "Form 1098-E from Keystone Student Loan Servicing". Review complete is not the same as verified.

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

## J8. An income question

Jordan's feed shows **Car loan interest**, $1,223.56 interest paid, **Needs your input**, "From your auto loan records at Summit Demo Credit Union", action "Answer 1 question". The loan records show a new vehicle, assembled in the US, bought for personal use with a 2026 loan. The one thing Salsa cannot know is whether his income is under this deduction's limit.

1. **Transactions** is skipped: the interest comes from the bank's own loan records.
2. **Questions.** "About how much do you expect your 2026 adjusted gross income (AGI) to be?" The options are ranges whose boundaries line up with the rules' income limits, plus "Not sure". Nothing is pre-selected. Help text explains AGI in plain language and notes that last year's return shows last year's figure, which may differ. His deposits are never shown or used. If this deduction's MAGI definition adds anything to AGI, one short follow-up asks only about those items.
3. **Result**, three possible outcomes:
   - His range is entirely below the limit: the income condition is met on his answer, and the status becomes **Verified**.
   - His range includes the limit: the status stays **Needs your input**: "Your range includes the income limit for this deduction, so we can't tell yet whether it applies." He is offered a narrower question for this deduction.
   - He chooses "Not sure": the status stays **Needs your input**.
4. **Saved.** He can save his review in any of these outcomes. His AGI answer appears in **My Review > About you**, labeled "Your estimate", and is reused for every other rule that needs it.

## J9. A joint account and privacy

Maya and her spouse Daniel are both customers of Tidewater Demo Bank and joint owners of their checking account. The mortgage is in Maya's name only.

1. Daniel signs in and opens Tax Opportunities. He sees the joint checking account's activity, including the church gifts, because the bank grants him visibility of that account, just as in online banking. He does not see the mortgage: he holds no visibility grant for it.
2. His Charitable giving opportunity is his own and is **not started**. None of Maya's work appears: not her "Yes" about the church, not her removal of the bookstore charge, not her filing status, not her AGI answer.
3. Maya's "Married filing jointly" answer did not add Daniel to anything and did not share anything with him. Each of them is in their own individual tax unit.
4. In Phase 3, either of them can invite the other to a shared tax unit. Sharing starts only after the invited person accepts, covers only the scopes each chooses, and stops as soon as either leaves.

## J10. Errors and empty states

| Situation | Customer sees | Next action |
| --- | --- | --- |
| No opportunities found | "We haven't found tax opportunities in your {bank} accounts for 2026 yet. We check again as new activity arrives." | "Answer 2 questions" (profile), if unanswered |
| No transactions yet for the tax year | "There's no 2026 activity yet." | Switch to the previous tax year, when available |
| Service unavailable | "{Feature name} isn't available right now. Your accounts aren't affected." | "Try again" |
| Saving an answer fails | Inline: "We couldn't save this answer. Check your connection and try again." | "Try again" (the answer stays in the field) |
| Opened outside the bank's pages | "Open {feature name} from your online banking." | None |
