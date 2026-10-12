import {
  type AccountKind,
  addDays,
  addMonths,
  daysInMonth,
  type FilingStatus,
  type IsoDate,
  isoDate,
  type LoanDetails,
  type TransactionType,
} from '@salsa/core';
import { amortize, monthlyPaymentCents } from './amortization';
import { MERCHANTS, type MerchantKey, type TruthCategory } from './merchants';
import { type PaidWith, type PersonaSpec, personasFor } from './personas';
import { createRng, hashSeed } from './random';

export interface GeneratedAccount {
  /** Stable within a persona: "checking", "credit_card", "mortgage", "auto_loan". */
  key: string;
  kind: AccountKind;
  name: string;
  /** Last four digits shown to the customer. */
  mask: string;
  openedOn: IsoDate;
  loan: LoanDetails | null;
}

export interface GeneratedTransaction {
  /** Stable id such as "maya-000123". Earlier transactions keep their ids when `through` moves forward. */
  key: string;
  accountKey: string;
  postedOn: IsoDate;
  /** Signed integer cents. See the sign convention on TRANSACTION_TYPES in @salsa/core. */
  amountCents: number;
  description: string;
  merchantName: string | null;
  mcc: string | null;
  type: TransactionType;
  /** Answer key for testing the categorizer. Real bank data has no such field, so never store it. */
  truthCategory: TruthCategory;
}

export interface GeneratedCustomer {
  personaId: string;
  displayName: string;
  birthYear: number;
  filingStatus: FilingStatus;
  state: string;
  summary: string;
  expectedFindings: string[];
  accounts: GeneratedAccount[];
  transactions: GeneratedTransaction[];
}

export interface GenerateOptions {
  taxYear: number;
  /** Change it for different (still reproducible) data. Defaults to "salsa". */
  seed?: string | number;
  /** Drop transactions after this date, to simulate a tax year still in progress. */
  through?: IsoDate;
}

type Draft = Omit<GeneratedTransaction, 'key'>;

export function generateCustomer(
  persona: PersonaSpec,
  options: GenerateOptions,
): GeneratedCustomer {
  const { taxYear: y } = options;
  const rng = createRng(hashSeed(options.seed ?? 'salsa', persona.id, y));
  const yearStart = isoDate(y, 1, 1);
  const yearEnd = isoDate(y, 12, 31);
  const { spending } = persona;
  const scaled = (cents: number) => Math.round(cents * spending.scale);

  const accounts: GeneratedAccount[] = [];
  const drafts: Draft[] = [];

  const addAccount = (account: Omit<GeneratedAccount, 'mask'>): GeneratedAccount => {
    const full = { ...account, mask: String(rng.int(1000, 9999)) };
    accounts.push(full);
    return full;
  };

  // Every transaction is generated for the whole year, then filtered at the end,
  // so the random sequence (and therefore every amount) ignores `through`.
  const push = (draft: Draft) => {
    if (draft.postedOn >= yearStart && draft.postedOn <= yearEnd) drafts.push(draft);
  };

  const purchase = (
    merchantKey: MerchantKey,
    amountCents: number,
    postedOn: IsoDate,
    paidWith: PaidWith = 'auto',
  ) => {
    const merchant = MERCHANTS[merchantKey];
    const onCard = paidWith === 'card' || (paidWith === 'auto' && rng.chance(spending.cardShare));
    push({
      accountKey: onCard ? 'credit_card' : 'checking',
      postedOn,
      amountCents: -amountCents,
      description: onCard
        ? merchant.statementName
        : `DEBIT CARD PURCHASE ${merchant.statementName}`,
      merchantName: merchant.name,
      mcc: merchant.mcc,
      type: 'purchase',
      truthCategory: merchant.category,
    });
  };

  /** Bank bill pay and ACH debits carry no merchant category code. */
  const billPay = (
    description: string,
    merchantName: string,
    amountCents: number,
    postedOn: IsoDate,
    truthCategory: TruthCategory,
  ) => {
    push({
      accountKey: 'checking',
      postedOn,
      amountCents: -amountCents,
      description,
      merchantName,
      mcc: null,
      type: 'bill_payment',
      truthCategory,
    });
  };

  const loanPayments = (
    account: GeneratedAccount,
    loan: LoanDetails,
    interestCategory: TruthCategory,
  ) => {
    for (const row of amortize(loan)) {
      if (row.dueOn > yearEnd) break;
      push({
        accountKey: 'checking',
        postedOn: row.dueOn,
        amountCents: -row.paymentCents,
        description: `ONLINE TRANSFER TO ${account.name.toUpperCase()} ...${account.mask}`,
        merchantName: null,
        mcc: null,
        type: 'transfer',
        truthCategory: 'loan_payment',
      });
      push({
        accountKey: account.key,
        postedOn: row.dueOn,
        amountCents: row.interestCents,
        description: 'PAYMENT APPLIED TO INTEREST',
        merchantName: null,
        mcc: null,
        type: 'loan_interest',
        truthCategory: interestCategory,
      });
      push({
        accountKey: account.key,
        postedOn: row.dueOn,
        amountCents: row.principalCents,
        description: 'PAYMENT APPLIED TO PRINCIPAL',
        merchantName: null,
        mcc: null,
        type: 'loan_principal',
        truthCategory: 'loan_principal',
      });
    }
  };

  const randomDayIn = (month: number) => isoDate(y, month, rng.int(1, daysInMonth(y, month)));

  // Accounts every persona has.
  addAccount({
    key: 'checking',
    kind: 'checking',
    name: 'Everyday Checking',
    openedOn: isoDate(y - rng.int(3, 12), rng.int(1, 12), rng.int(1, 28)),
    loan: null,
  });
  const card = addAccount({
    key: 'credit_card',
    kind: 'credit_card',
    name: 'Rewards Credit Card',
    openedOn: isoDate(y - rng.int(1, 6), rng.int(1, 12), rng.int(1, 28)),
    loan: null,
  });

  // Income
  for (const source of persona.income) {
    for (let n = 0; ; n++) {
      const postedOn =
        source.cadence === 'biweekly'
          ? addDays(source.firstPayOn, n * 14)
          : addMonths(source.firstPayOn, n);
      if (postedOn > yearEnd) break;
      push({
        accountKey: 'checking',
        postedOn,
        amountCents: source.amountCents,
        description: `DIRECT DEP ${source.description}`,
        merchantName: null,
        mcc: null,
        type: 'deposit',
        truthCategory: 'income',
      });
    }
  }

  // Housing
  const { housing } = persona;
  if (housing.kind === 'rent') {
    for (let month = 1; month <= 12; month++) {
      billPay(
        `ACH PMT ${housing.landlord} RENT`,
        housing.landlord,
        housing.amountCents,
        isoDate(y, month, housing.day),
        'rent',
      );
    }
  } else if (housing.kind === 'mortgage') {
    const mortgage = addAccount({
      key: 'mortgage',
      kind: 'mortgage',
      name: 'Home Mortgage',
      openedOn: housing.loan.originatedOn,
      loan: housing.loan,
    });
    loanPayments(mortgage, housing.loan, 'mortgage_interest');
  }

  if (persona.propertyTax) {
    const county = MERCHANTS.countyTax;
    for (const month of persona.propertyTax.months) {
      billPay(
        `BILL PAY ${county.statementName}`,
        county.name,
        persona.propertyTax.installmentCents,
        isoDate(y, month, 15),
        'property_tax',
      );
    }
  }

  // A new car bought during the year with a loan from this bank.
  if (persona.autoPurchase) {
    const { loan, dealer, downPaymentCents } = persona.autoPurchase;
    purchase(dealer, downPaymentCents, loan.originatedOn, 'checking');
    const autoLoan = addAccount({
      key: 'auto_loan',
      kind: 'auto_loan',
      name: 'Auto Loan',
      openedOn: loan.originatedOn,
      loan,
    });
    loanPayments(autoLoan, loan, 'auto_loan_interest');
  }

  // A student loan held by an outside servicer: the bank only sees the payments.
  if (persona.externalStudentLoan) {
    const loan = persona.externalStudentLoan;
    const payment = monthlyPaymentCents(loan);
    for (let n = 0; n < loan.termMonths; n++) {
      const postedOn = addMonths(loan.firstPaymentOn, n);
      if (postedOn > yearEnd) break;
      billPay(
        `ACH PMT ${loan.statementName}`,
        loan.servicer,
        payment,
        postedOn,
        'student_loan_payment',
      );
    }
  }

  // Everyday spending
  for (
    let day = addDays(yearStart, rng.int(0, 3));
    day <= yearEnd;
    day = addDays(day, rng.int(5, 9))
  ) {
    purchase(rng.pick(['freshFields', 'valueBasket'] as const), scaled(rng.cents(55, 150)), day);
  }

  if (spending.drives) {
    for (
      let day = addDays(yearStart, rng.int(0, 5));
      day <= yearEnd;
      day = addDays(day, rng.int(8, 13))
    ) {
      purchase(rng.pick(['quickFuel', 'lakesideGas'] as const), rng.cents(32, 68), day);
    }
  }

  for (let month = 1; month <= 12; month++) {
    const restaurants = Math.round(rng.int(3, 7) * spending.scale);
    for (let i = 0; i < restaurants; i++) {
      const merchant = rng.pick(['lunaTrattoria', 'copperPot', 'saigonNoodle'] as const);
      purchase(merchant, scaled(rng.cents(18, 85)), randomDayIn(month));
    }
    const quickBites = rng.int(2, 6);
    for (let i = 0; i < quickBites; i++) {
      purchase(
        rng.pick(['beanThere', 'tacoCorner'] as const),
        rng.cents(4.5, 16),
        randomDayIn(month),
      );
    }
    const shopping = rng.int(0, 3);
    for (let i = 0; i < shopping; i++) {
      const merchant = rng.pick(['threadline', 'parcelMarket'] as const);
      purchase(merchant, scaled(rng.cents(12, 140)), randomDayIn(month));
    }
    if (spending.homeowner && rng.chance(0.5)) {
      purchase('homeBuild', rng.cents(30, 220), randomDayIn(month));
    }

    // Monthly bills
    const powerRange: [number, number] = spending.homeowner ? [110, 230] : [65, 140];
    purchase('cityPower', rng.cents(...powerRange), isoDate(y, month, 12));
    if (spending.homeowner) purchase('metroWater', rng.cents(38, 72), isoDate(y, month, 20));
    const phonePlan = persona.filingStatus === 'married_joint' ? 14000 : 6500;
    purchase('clearwave', phonePlan, isoDate(y, month, 8), 'checking');
    purchase('streamBox', 1549, isoDate(y, month, 3), 'card');
    if (spending.autoInsuranceCents) {
      purchase('shieldInsurance', spending.autoInsuranceCents, isoDate(y, month, 5), 'checking');
    }
    if (spending.transitPass) purchase('metroTransit', 8600, isoDate(y, month, 1), 'card');
  }

  // Persona-specific charges: giving, medical, subscriptions.
  for (const charge of persona.monthly) {
    for (let month = charge.fromMonth ?? 1; month <= 12; month++) {
      purchase(charge.merchant, charge.amountCents, isoDate(y, month, charge.day), charge.paidWith);
    }
  }
  for (const charge of persona.oneOff) {
    purchase(
      charge.merchant,
      charge.amountCents,
      isoDate(y, charge.month, charge.day),
      charge.paidWith,
    );
  }

  // Pay off each month's card purchases in full on the 20th of the next month.
  const cardSpendByMonth = new Map<number, number>();
  for (const draft of drafts) {
    if (draft.accountKey !== 'credit_card' || draft.type !== 'purchase') continue;
    const month = Number(draft.postedOn.slice(5, 7));
    cardSpendByMonth.set(month, (cardSpendByMonth.get(month) ?? 0) - draft.amountCents);
  }
  for (const [month, total] of cardSpendByMonth) {
    const postedOn = addMonths(isoDate(y, month, 20), 1);
    push({
      accountKey: 'checking',
      postedOn,
      amountCents: -total,
      description: `ONLINE PMT TO CREDIT CARD ...${card.mask}`,
      merchantName: null,
      mcc: null,
      type: 'transfer',
      truthCategory: 'card_payment',
    });
    push({
      accountKey: 'credit_card',
      postedOn,
      amountCents: total,
      description: 'PAYMENT RECEIVED - THANK YOU',
      merchantName: null,
      mcc: null,
      type: 'transfer',
      truthCategory: 'card_payment',
    });
  }

  // Array.prototype.sort is stable, so same-day transactions keep generation order.
  const transactions = drafts
    .sort((a, b) => (a.postedOn < b.postedOn ? -1 : a.postedOn > b.postedOn ? 1 : 0))
    .filter((draft) => !options.through || draft.postedOn <= options.through)
    .map((draft, index) => ({
      key: `${persona.id}-${String(index + 1).padStart(6, '0')}`,
      ...draft,
    }));

  return {
    personaId: persona.id,
    displayName: persona.displayName,
    birthYear: persona.birthYear,
    filingStatus: persona.filingStatus,
    state: persona.state,
    summary: persona.summary,
    expectedFindings: persona.expectedFindings,
    accounts,
    transactions,
  };
}

export function generateAll(options: GenerateOptions): GeneratedCustomer[] {
  return personasFor(options.taxYear).map((persona) => generateCustomer(persona, options));
}
