# Data model for findings, reviews and permissions

Status: approved. Decision records: [0003](../decisions/0003-finding-status-derived-from-evidence.md) (status), [0004](../decisions/0004-customer-review-separate-from-engine-status.md) (reviews), [0009](../decisions/0009-income-information.md) (income), [0010](../decisions/0010-ownership-visibility-and-tax-unit-access.md) (permissions), [0011](../decisions/0011-saved-review-snapshots.md) (saved evaluations).

## Layers of knowledge

1. **Classification**: what a transaction is. Produced by the categorizer. No tax vocabulary.
2. **Facts and evidence**: what Salsa knows, from whom, and how strongly. Facts about a person belong to that person.
3. **Findings**: what a tax rule concludes from those facts, for one tax unit. Produced by the tax engine.

A fourth record, the **customer review**, captures what a person checked and signed off. It sits beside findings and never changes their status directly.

## Finding

```ts
type FindingStatus = 'verified' | 'potential' | 'needs_information';
// Internal: 'ruled_out' (a condition is not met). Shown only in the collapsed
// "Checked, doesn't apply" list, with its reason.

interface Finding {
  id: string;                        // stable: rule id + tax year + tax unit
  taxUnitId: string;
  ruleId: string;                    // 'us.2026.individual.mortgage_interest'
  ruleVersion: string;               // changes when the rule's sources or logic change
  category: OpportunityCategory;     // 'charitable_giving', 'mortgage_interest', ...
  status: FindingStatus;             // derived from conditions; never assigned
  treatment: 'itemized' | 'any_filer' | 'adjustment' | 'business_expense';
  paid: AmountEstimate;              // what was paid, from accounts this person can see
  deductible: AmountEstimate | null; // after caps, floors and income limits; a range in phase-outs
  conditions: ConditionResult[];
  evidence: Evidence[];
  requests: InformationRequest[];    // what would move this finding forward
  inputsFingerprint: string;         // hash of evidence and facts used; detects outdated reviews
}

interface AmountEstimate {
  cents: number;
  basis: 'tax_form' | 'bank_records' | 'transactions_to_date' | 'customer_reported' | 'estimate';
  rangeCents?: [number, number];
}

interface ConditionResult {
  conditionId: string;               // 'vehicle.final_assembly_us', 'income.magi_below_limit'
  state: 'met' | 'likely' | 'unknown' | 'not_met';
  evidenceIds: string[];
  source: { title: string; url: string };  // the IRS text that creates the condition
}

interface Evidence {
  id: string;
  kind: 'tax_form' | 'bank_account_record' | 'transaction' | 'classification'
      | 'customer_answer' | 'customer_correction' | 'document';
  strength: 'authoritative' | 'attested' | 'inferred';
  ref: string;                       // transaction id, account id, answer id
  summary: string;                   // "12 payments to Grace Community Church"
}

interface InformationRequest {
  id: string;                        // 'filing_status', 'agi_range', 'charity_qualified', 'form_1098e_interest'
  kind: 'question' | 'confirmation' | 'document';
  scope: 'profile' | 'opportunity';  // profile questions are asked once and reused
  unlocks: string[];                 // condition ids it can settle
  required: boolean;
}
```

### Evidence strength

| Strength | Comes from | Can make a condition |
| --- | --- | --- |
| `authoritative` | Lender tax forms, the bank's own account and loan records | `met` or `not_met` |
| `attested` | The person's own answers and corrections, including income ranges | `met` or `not_met`, when the answer settles it |
| `inferred` | Merchant names, merchant category codes, descriptions, classifier output, Salsa's own estimates | `likely`, never `met` |

### Status derivation

```
if any condition is not_met            -> ruled_out (shown only in "Checked, doesn't apply")
else if any condition is unknown       -> needs_information
else if any condition is likely        -> potential
else                                   -> verified
```

Verified means eligibility is supported by the information Salsa can evaluate. It is never a guarantee of IRS acceptance. A finding supported only by merchant information can be at most `potential`; a test runs this invariant against every rule.

## Income

```ts
type IncomeMeasure = 'agi' | { magi: string };   // e.g. { magi: 'us.2026.vehicle_loan_interest' }

interface IncomeAnswer {
  partyId: string;
  taxYear: number;
  measure: IncomeMeasure;
  range: [number, number] | 'unsure';   // cents; the upper bound may be open (Infinity)
  isEstimate: boolean;                   // true while the tax year is in progress
}
```

- Each rule declares the measure it uses and its thresholds, with sources.
- A condition is settled only when the whole range lies on one side of the threshold; otherwise it stays `unknown`. A range inside a phase-out band yields a deductible amount range.
- No code path derives an `IncomeAnswer` from deposits, balances or transfers ([ADR 0009](../decisions/0009-income-information.md)).

## Customer review and answers

```ts
type ReviewStatus = 'not_started' | 'in_progress' | 'reviewed' | 'outdated' | 'dismissed';

interface OpportunityReview {
  partyId: string;                   // reviews belong to the person who made them
  findingId: string;
  status: ReviewStatus;
  reviewedAt: string | null;
  evaluationId: string | null;       // the saved engine evaluation the person signed off on
  inputsFingerprint: string | null;  // compared with the finding's to detect 'outdated'
  dismissal: { reason: DismissReason | null; at: string } | null;
}

type TransactionDecision =
  | { kind: 'excluded'; partyId: string; transactionId: string; reason: 'not_this_category' | 'refunded' | 'other' }
  | { kind: 'recategorized'; partyId: string; transactionId: string; category: ClassificationCategory | 'unsure' };

interface CustomerAnswer {
  partyId: string;
  questionId: string;                // matches InformationRequest.id
  value: AnswerValue | 'unsure';
  taxYear: number;
  answeredAt: string;
  sessionId: string;                 // audit: which widget session
  supersedes: string | null;         // previous answer id; history is kept
}
```

Decisions and answers are saved as soon as the person makes them and become `attested` evidence for that person's tax unit only. The review record is the person's sign-off on one evaluation. See [states](../product/opportunity-feed/states.md) for every transition.

## Ownership, visibility and tax units

```ts
interface Party { id: string; kind: 'person' | 'business'; }

interface AccountHolder {            // ownership, from the bank
  partyId: string;
  accountId: string;
  role: 'owner' | 'joint_owner' | 'authorized_user' | 'signer';
}

interface AccountVisibilityGrant {   // visibility, from the bank's entitlements
  partyId: string;
  accountId: string;
  grantedAt: string;
  revokedAt: string | null;
}

interface TaxUnit {
  id: string;
  taxYear: number;
  kind: 'individual' | 'shared';     // every person has an individual tax unit per year
  filingStatus: FilingStatus | null; // answered by a member; never inferred from marriage
}

interface TaxUnitMember {            // tax unit access, by each member's own consent
  taxUnitId: string;
  partyId: string;
  status: 'invited' | 'active' | 'declined' | 'left';
  consentedAt: string | null;
  consentSessionId: string | null;
  sharingScopes: SharingScope[];     // what this member shares; default none
}

type SharingScope = 'opportunities_from_shared_accounts' | 'profile_answers' | { answers: OpportunityCategory };
```

Rules: visibility is required to see any account, even for owners; ownership alone grants nothing in Salsa; shared tax units exist only after each member accepts; marriage, a filing status answer or joint ownership never creates one ([ADR 0010](../decisions/0010-ownership-visibility-and-tax-unit-access.md)).

## Comparison and benefit

```ts
interface DeductionComparison {
  filingStatus: FilingStatus | null;
  standardRange: [number, number] | null;       // cents; widened by unanswered additions
  itemizedRange: [number, number | null];       // [verified only, verified + max of unconfirmed]; null = unbounded
  state:
    | { kind: 'incomplete'; reason: 'needs_filing_status' | 'too_early' | 'depends_on_open_items'
                                  | 'year_in_progress' | 'too_close'; decidingRequests: string[] }
    | { kind: 'provisional'; leaning: 'itemize' }
    | { kind: 'complete'; leaning: 'standard' | 'itemize' };
  basis: { dataThrough: string; lenderFormsReceived: boolean };
}

interface BenefitEstimate {            // Summary, Phase 3; only with filing status and an AGI range
  federalTaxReductionCents: [number, number];
  marginalRates: [number, number];
  assumptions: string[];
}
```

The comparison leans only when the leaning holds across both ranges ([states](../product/opportunity-feed/states.md#6-deduction-comparison)). A benefit estimate is never a sum of deduction amounts ([ADR 0008](../decisions/0008-deduction-amounts-are-not-tax-savings.md)).

## Tables (all tenant-scoped, composite foreign keys)

| Table | Holds | PR |
| --- | --- | --- |
| `parties` | People and (later) businesses | 4 |
| `account_holders` | Ownership: who holds each account, in what role | 4 |
| `account_visibility_grants` | Visibility: which accounts each person may see, from the bank | 4 |
| `tax_units`, `tax_unit_members` | Returns per tax year; membership by consent, with sharing scopes | 4 |
| `bank_tax_records` | Lender figures from Forms 1098, 1098-VLI, 1099-INT | 4 |
| `customer_facts` | Bank-provided attributes and each person's answers, append-only, owned by a party | 4 |
| `transaction_classifications` | Category, confidence, signals, classifier version | 5 |
| `tax_evaluations` | Saved engine runs: rules version, engine version, inputs fingerprint | 7 |
| `findings` | Findings belonging to an evaluation | 7 |
| `transaction_decisions` | Each person's exclusions and recategorizations, versioned | 7 |
| `opportunity_reviews` | Each person's sign-offs and dismissals | 7 |
| `audit_events` | Who changed what, from which session | 7 |
| `tenant_experience_configs` | Versioned bank configuration ([configuration](../product/opportunity-feed/configuration.md)) | 8 |
