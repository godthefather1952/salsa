# Data model for findings and reviews

Status: the classification names are approved; the structures below are proposed in [ADR 0003](../decisions/0003-finding-status-derived-from-evidence.md) and [ADR 0004](../decisions/0004-customer-review-separate-from-engine-status.md).

## Three layers of knowledge

1. **Classification**: what a transaction is. Produced by the categorizer. No tax vocabulary.
2. **Facts and evidence**: what Salsa knows about the customer, from whom, and how strongly.
3. **Findings**: what a tax rule concludes from those facts. Produced by the tax engine.

A fourth record, the **customer review**, captures what the customer checked and signed off. It sits beside findings and never changes their status directly.

## Finding

```ts
type FindingStatus = 'verified' | 'potential' | 'needs_information';
// Internal only: 'ruled_out' (a condition is not met). Kept for audit, not shown as an opportunity.

interface Finding {
  id: string;                        // stable: rule id + tax year + tax unit
  ruleId: string;                    // 'us.2026.individual.mortgage_interest'
  ruleVersion: string;               // changes when the rule's sources or logic change
  category: OpportunityCategory;     // 'charitable_giving', 'mortgage_interest', ...
  status: FindingStatus;             // derived from conditions; never assigned
  treatment: 'itemized' | 'any_filer' | 'adjustment' | 'business_expense';
  paid: AmountEstimate;              // what the customer paid
  deductible: AmountEstimate | null; // after caps, floors and income limits; null until knowable
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
  conditionId: string;               // 'vehicle.final_assembly_us'
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
  id: string;                        // 'income_range', 'charity_qualified', 'form_1098e_interest'
  kind: 'question' | 'confirmation' | 'document';
  scope: 'profile' | 'opportunity';  // profile questions are asked once and reused
  unlocks: string[];                 // condition ids it can settle
  required: boolean;
}
```

### Evidence strength

| Strength | Comes from | Can make a condition |
| --- | --- | --- |
| `authoritative` | Lender tax forms, the bank's own account and loan records | `met` |
| `attested` | The customer's answers and corrections | `met` |
| `inferred` | Merchant names, merchant category codes, descriptions, classifier output, estimates | `likely`, never `met` |

### Status derivation

```
if any condition is not_met            -> ruled_out (internal)
else if any condition is unknown       -> needs_information
else if any condition is likely        -> potential
else                                   -> verified
```

Consequence: a finding supported only by merchant information can be at most `potential`. A test runs this invariant against every rule.

## Customer review

```ts
type ReviewStatus = 'not_started' | 'in_progress' | 'reviewed' | 'outdated' | 'dismissed';

interface OpportunityReview {
  findingId: string;
  status: ReviewStatus;
  reviewedAt: string | null;
  evaluationId: string | null;       // the saved engine evaluation the customer signed off on
  inputsFingerprint: string | null;  // compared with the finding's to detect 'outdated'
  dismissal: { reason: DismissReason | null; at: string } | null;
}

type TransactionDecision =
  | { kind: 'excluded'; transactionId: string; reason: 'not_this_category' | 'refunded' | 'other' }
  | { kind: 'recategorized'; transactionId: string; category: ClassificationCategory | 'unsure' };

interface CustomerAnswer {
  questionId: string;                // matches InformationRequest.id
  value: AnswerValue | 'unsure';
  taxYear: number;
  answeredAt: string;
  sessionId: string;                 // audit: which widget session
  supersedes: string | null;         // previous answer id; history is kept
}
```

Transaction decisions and answers are saved as soon as the customer makes them and become `attested` evidence. The review record is the customer's sign-off on one evaluation. See [states](../product/opportunity-feed/states.md) for every transition.

## Comparison and benefit

```ts
interface DeductionComparison {
  filingStatus: FilingStatus | null;
  standard: AmountEstimate | null;     // null until filing status is known
  itemized: { verified: number; potential: number };   // cents, excluding dismissed items
  outcome: 'needs_filing_status' | 'standard_likely' | 'itemize_likely' | 'too_close' | 'not_enough_data';
}

interface BenefitEstimate {            // only when filing status and income range are known
  federalTaxReductionCents: [number, number];
  marginalRates: [number, number];
  assumptions: string[];
}
```

A benefit estimate is never a sum of deduction amounts ([ADR 0008](../decisions/0008-deduction-amounts-are-not-tax-savings.md)).

## Tables (all tenant-scoped, composite foreign keys)

| Table | Holds | PR |
| --- | --- | --- |
| `parties`, `account_holders` | People and (later) businesses; who holds each account | 4 |
| `tax_units` | A return: filer parties, tax year, filing status | 4 |
| `bank_tax_records` | Lender figures from Forms 1098, 1098-VLI, 1099-INT | 4 |
| `customer_facts` | Bank-provided attributes and customer answers, append-only with source | 4 |
| `transaction_classifications` | Category, confidence, signals, classifier version | 5 |
| `tax_evaluations` | Saved engine runs: rules version, engine version, inputs fingerprint | 7 |
| `findings` | Findings belonging to an evaluation | 7 |
| `transaction_decisions` | Customer exclusions and recategorizations, versioned | 7 |
| `opportunity_reviews` | Customer sign-offs and dismissals | 7 |
| `audit_events` | Who changed what, from which session | 7 |
| `tenant_experience_configs` | Versioned bank configuration ([configuration](../product/opportunity-feed/configuration.md)) | 8 |
