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

Derived by the engine, never set by the customer or the interface. Derivation rules: [ADR 0003](../../decisions/0003-finding-status-derived-from-evidence.md).

| State | Definition | Shown to customer |
| --- | --- | --- |
| `verified` | Every condition is met by authoritative or customer-attested evidence | Yes |
| `potential` | No condition fails or is unknown, but at least one rests only on inferred evidence | Yes |
| `needs_information` | At least one condition is unknown | Yes |
| `ruled_out` | At least one condition is not met | No (kept for audit; see open questions) |

Any status can change to any other after re-evaluation. Re-evaluation happens when transactions arrive, a transaction decision changes, an answer changes, or rules are updated.

## 3. Review status (customer)

| State | Meaning |
| --- | --- |
| `not_started` | The customer has not opened the review flow for this opportunity |
| `in_progress` | The customer made at least one decision or answer but has not saved a review |
| `reviewed` | The customer saved a review of a specific evaluation |
| `outdated` | Saved, but the opportunity's inputs have changed since |
| `dismissed` | The customer marked the opportunity "Not relevant to me" |

| From | To | Trigger |
| --- | --- | --- |
| `not_started` | `in_progress` | First decision or answer in the flow |
| `not_started`, `in_progress`, `outdated` | `reviewed` | "Save review" |
| `reviewed` | `in_progress` | Customer edits a decision or answer for this opportunity |
| `reviewed` | `outdated` | Inputs fingerprint changes without customer action (new transactions, an edited profile answer) |
| any except `dismissed` | `dismissed` | "Not relevant to me" |
| `dismissed` | previous state | "Restore" |

Saving a review is allowed in every eligibility status. A reviewed opportunity may be Potential or Needs information; a Verified opportunity may be not started.

## 4. Transaction decision (per transaction, per opportunity)

| State | Meaning | Effect on evidence |
| --- | --- | --- |
| `suggested` | Included by the engine; customer has not acted | Inferred |
| `kept` | Customer confirmed it belongs | Attested that it belongs to this category |
| `removed` | Customer removed it, with reason (not this category, refunded, other) | Excluded |
| `recategorized` | Customer said it is something else, or "Not sure" | Excluded from this opportunity; "Not sure" stays suggested |

All transitions are reversible ("Restore", "Undo"). Every change is audit-logged with its session.

## 5. Answer (per question)

| State | Meaning |
| --- | --- |
| `unanswered` | No answer yet |
| `answered` | A value was given |
| `unsure` | The customer chose "Not sure"; the condition stays unknown or likely |
| `superseded` | Replaced by a newer answer; history kept, not shown by default |

Profile answers (filing status, income range) are shared by all opportunities; changing one re-evaluates everything that uses it.

## 6. Deduction comparison

| State | Condition | Sentence |
| --- | --- | --- |
| `needs_filing_status` | Filing status unknown | Add your filing status to compare. |
| `not_enough_data` | Less than 2 months of activity in the tax year | It's early in the year to compare. |
| `standard_likely` | Itemizable total (Verified + Potential) below standard deduction minus the margin | So far, the standard deduction is larger. |
| `itemize_likely` | Verified itemizable total alone exceeds the standard deduction plus the margin | So far, itemizing may give you a larger deduction. |
| `too_close` | Otherwise | These are close; your remaining activity will decide. |

The margin (proposed: 10% of the standard deduction) avoids flipping the message on small changes. Dismissed opportunities are excluded from totals.

## 7. Annual review progress

- Items: each unanswered required profile question, plus each opportunity that is not dismissed.
- An item counts as done when its profile question is answered (including "Not sure") or its opportunity is `reviewed`.
- `not_started` (0 done), `in_progress`, `complete` (all done). Outdated opportunities are not done.
- Progress reads "{done} of {total} reviewed". It never mentions verification.

## 8. Data freshness

- The header shows "Data through {date}", the latest posted transaction date.
- Pending transactions are excluded until posted.
- When the tax year has closed and lender tax forms arrive, amounts switch from "so far" to the form figures, and affected reviews become outdated.
