# State definitions

Every state the interface can show, what causes it, and which transitions are allowed. The engine's eligibility status and the customer's review status are independent ([ADR 0004](../../decisions/0004-customer-review-separate-from-engine-status.md)).

## 1. Widget session

| State | Cause | Shown |
| --- | --- | --- |
| `loading` | Bootstrap request in flight | Skeleton of the current view |
| `ready` | Valid session and configuration | Normal interface |
| `expiring` | Less than 2 minutes left on the token | Non-blocking notice with "Stay signed in" |
| `expired` | Token expired and refresh failed | "For your security, this view has closed. Your answers are saved." Action: Reload |
| `unavailable` | API unreachable or server error | "{Feature name} isn't available right now. Your accounts aren't affected." Action: Try again |
| `no_session` | Opened without a token | "Open {feature name} from your online banking." No action |
| `blocked_embed` | Opened outside a registered bank origin | Browser refuses to render (content security policy); nothing to design |

`ready → expiring → ready` on successful refresh; `expiring → expired` on failure; any state → `unavailable` on server failure; `unavailable → loading` on retry.

## 2. Eligibility status (engine)

Derived by the engine, never set by the customer or the interface ([ADR 0003](../../decisions/0003-finding-status-derived-from-evidence.md)).

| State | Definition | Customer label | Shown |
| --- | --- | --- | --- |
| `verified` | Every condition is met by authoritative or customer-attested evidence | Verified | In the feed, with "What Verified means" |
| `potential` | No condition fails or is unknown, but at least one rests only on inferred evidence | Potential | In the feed |
| `needs_information` | At least one condition is unknown, including income conditions not yet answered or not settled by the answer | Needs your input | In the feed |
| `ruled_out` | At least one condition is not met | Checked, doesn't apply | In a collapsed list in Discover, with the reason |

Verified means eligibility is supported by the information Salsa can evaluate. It is never presented as IRS acceptance.

Any status can change to any other after re-evaluation. Re-evaluation happens when transactions arrive, a transaction decision changes, an answer changes, a visibility grant changes, or rules are updated.

## 3. Review status (customer)

| State | Meaning |
| --- | --- |
| `not_started` | The customer has not opened the review flow for this opportunity |
| `in_progress` | The customer made at least one decision or answer but has not saved a review |
| `reviewed` | The customer saved a review of a specific evaluation |
| `outdated` | Saved, but the opportunity's inputs have changed since |
| `dismissed` | The customer marked the opportunity "Not relevant to me" (optional reason) |

| From | To | Trigger |
| --- | --- | --- |
| `not_started` | `in_progress` | First decision or answer in the flow |
| `not_started`, `in_progress`, `outdated` | `reviewed` | "Save review" |
| `reviewed` | `in_progress` | Customer edits a decision or answer for this opportunity |
| `reviewed` | `outdated` | Inputs fingerprint changes without customer action (new transactions, an edited profile answer, a revoked visibility grant) |
| any except `dismissed` | `dismissed` | "Not relevant to me" |
| `dismissed` | previous state | "Restore" |

Saving a review is allowed in every eligibility status. A reviewed opportunity may be Potential or Needs your input; a Verified opportunity may be not started. Review status belongs to the person who made it and is private to them unless shared through a tax unit (section 9).

## 4. Transaction decision (per transaction, per opportunity)

| State | Meaning | Effect on evidence |
| --- | --- | --- |
| `suggested` | Included by the engine; customer has not acted | Inferred |
| `kept` | Customer confirmed it belongs | Attested that it belongs to this category |
| `removed` | Customer removed it, with reason (not this category, refunded, other) | Excluded |
| `recategorized` | Customer chose a short context-specific option ("A purchase, not a gift", "Not a medical cost", "Something else") or "Not sure" | Excluded from this opportunity; "Not sure" stays suggested |

All transitions are reversible ("Restore", "Undo"). Every change is audit-logged with its session. On a joint account, each holder's decisions are their own.

## 5. Answer (per question)

| State | Meaning |
| --- | --- |
| `unanswered` | No answer yet |
| `answered` | A value or range was given |
| `unsure` | The customer chose "Not sure"; the condition stays unknown or likely |
| `superseded` | Replaced by a newer answer; history kept, not shown by default |

Profile answers (filing status, AGI range, MAGI follow-ups) are shared by all of that person's opportunities; changing one re-evaluates everything that uses it.

### Income answers

- AGI and MAGI are asked as ranges aligned with rule thresholds, plus "Not sure". They are never pre-filled from bank data ([ADR 0009](../../decisions/0009-income-information.md)).
- A condition is settled only when the whole answered range is on one side of the rule's threshold. If the range straddles the threshold, the condition stays unknown and the customer is offered a narrower question for that rule.
- If the range falls within a phase-out band, the deductible amount is shown as a range.
- Answers for a year in progress are labeled as estimates and can be updated at any time.

## 6. Deduction comparison

The comparison never recommends more than the information supports. It works with bounds:

- **Standard deduction range** for the customer's filing status. Additions that depend on unanswered facts (for example blindness, or a spouse's age) widen the range.
- **Itemized lower bound**: deductible amounts of Verified itemized findings only.
- **Itemized upper bound**: the lower bound plus the largest possible deductible amount of every Potential and Needs-your-input itemized finding. A finding with no upper limit makes the upper bound unknown.
- Dismissed and ruled-out findings are excluded. The margin is 10% of the standard deduction.

| State | Condition | Sentence | Action |
| --- | --- | --- | --- |
| `incomplete` (`needs_filing_status`) | Filing status unknown | We can't compare yet. We need your filing status. | Add filing status |
| `incomplete` (`too_early`) | Less than 2 months of activity in the tax year | It's too early in the year to compare. | None |
| `incomplete` (`depends_on_open_items`) | The itemized bounds straddle the standard deduction range because of unconfirmed items | We can't recommend one yet. It depends on {n} items you haven't confirmed. | Review {first deciding item} |
| `incomplete` (`year_in_progress`) | The year is still in progress and the itemized lower bound has not passed the standard deduction range. Later activity could still change the answer, so no leaning toward the standard deduction is shown before the year ends | It's too early to tell. So far, your itemizable amounts are below the standard deduction, and the rest of the year can change that. | None |
| `incomplete` (`too_close`) | No open items, but the totals are within the margin | These are too close to call with the information we have. | None |
| `provisional` (`itemize`) | Year in progress, and the itemized lower bound (Verified only) already exceeds the top of the standard deduction range by more than the margin | Based on what we've verified so far, itemizing looks larger. This can change if any of these items change. | View details |
| `complete` (`standard`) | Tax year closed, lender tax forms received, and the itemized upper bound is below the bottom of the standard deduction range by more than the margin | Based on your full-year records at {bank} and your answers, the standard deduction looks larger. Deductible expenses paid from other banks could change this. | View details |
| `complete` (`itemize`) | Tax year closed, lender tax forms received, and the itemized lower bound exceeds the top of the standard deduction range by more than the margin | Based on your full-year records at {bank} and your answers, itemizing looks larger. | View details |

Every state carries the label "Estimate" and shows which items it is based on. No state names a tax saving or a dollar difference as savings.

## 7. Annual review progress

- Items: each required profile question for this person (filing status always; AGI range only when a rule in scope needs it), plus each opportunity that is not dismissed.
- An item counts as done when its profile question is answered (including "Not sure") or its opportunity is `reviewed`.
- `not_started` (0 done), `in_progress`, `complete` (all done). Outdated opportunities are not done.
- Progress reads "{done} of {total} reviewed". It never mentions verification.

## 8. Tax year and data freshness

- From January 1 to April 15, the previous tax year is shown by default, with the year switcher visible. Otherwise the current year is shown. Only years in `managed.taxYears` are offered.
- The header shows "Data through {date}", the latest posted transaction date.
- Pending transactions are excluded until posted.
- When the tax year has closed and lender tax forms arrive, amounts switch from "so far" to the form figures, affected reviews become outdated, and the comparison can become `complete`.

## 9. Tax unit membership

Model built in Phase 2; the shared tax unit experience is built in Phase 3 ([ADR 0010](../../decisions/0010-ownership-visibility-and-tax-unit-access.md)).

| State | Meaning |
| --- | --- |
| `individual` | Default for every person and tax year. Nothing is shared |
| `invited` | A member invited this person to a shared tax unit; nothing is shared yet |
| `active` | This person accepted; only the sharing scopes they chose are shared |
| `declined` | This person declined; nothing is shared |
| `left` | This person left; sharing stops from that moment; their private data returns to private |

- Marriage, a "married filing jointly" answer, or joint account ownership never creates any state other than `individual`.
- Each member chooses their own sharing scopes; the default is none.
- **Visibility grants** are separate: a grant is `active` or `revoked` by the bank. When revoked, the account disappears from that person's views, its evidence is excluded at the next evaluation, and affected reviews become outdated.
