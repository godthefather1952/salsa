import {
  dollarsToCents,
  type FilingStatus,
  type IsoDate,
  isoDate,
  type LoanDetails,
} from '@salsa/core';
import type { MerchantKey } from './merchants';

/**
 * Personas are fictional bank customers, each built to exercise a different
 * part of the tax engine. Everything is defined relative to the tax year so
 * the same personas work for 2026, 2027 and beyond.
 */

/** Which account a purchase is paid from. `auto` lets the generator pick using `cardShare`. */
export type PaidWith = 'checking' | 'card' | 'auto';

export interface IncomeSource {
  /** Shown on the statement, e.g. "BRIGHTLINE LOGISTICS PAYROLL". */
  description: string;
  cadence: 'biweekly' | 'monthly';
  amountCents: number;
  firstPayOn: IsoDate;
}

export interface MonthlyCharge {
  merchant: MerchantKey;
  amountCents: number;
  day: number;
  /** First month (1-12) the charge appears. Defaults to January. */
  fromMonth?: number;
  paidWith?: PaidWith;
}

export interface OneOffCharge {
  merchant: MerchantKey;
  amountCents: number;
  month: number;
  day: number;
  paidWith?: PaidWith;
}

export type Housing =
  | { kind: 'rent'; landlord: string; amountCents: number; day: number }
  | { kind: 'mortgage'; loan: LoanDetails }
  | { kind: 'owned_outright' };

/** A loan held at a different company. The bank sees payments but not the interest split. */
export interface ExternalLoan {
  servicer: string;
  statementName: string;
  principalCents: number;
  aprPercent: number;
  termMonths: number;
  firstPaymentOn: IsoDate;
}

export interface SpendingProfile {
  /** Multiplier on everyday spending (groceries, dining, shopping). */
  scale: number;
  drives: boolean;
  homeowner: boolean;
  transitPass: boolean;
  /** Probability an everyday purchase goes on the credit card instead of the debit card. */
  cardShare: number;
  autoInsuranceCents?: number;
}

export interface PersonaSpec {
  id: string;
  displayName: string;
  birthYear: number;
  filingStatus: FilingStatus;
  state: string;
  /** One line describing who this is. */
  summary: string;
  /** What salsa should eventually surface for this customer. Used in docs and demos. */
  expectedFindings: string[];
  income: IncomeSource[];
  housing: Housing;
  propertyTax?: { installmentCents: number; months: number[] };
  autoPurchase?: { dealer: MerchantKey; downPaymentCents: number; loan: LoanDetails };
  externalStudentLoan?: ExternalLoan;
  spending: SpendingProfile;
  monthly: MonthlyCharge[];
  oneOff: OneOffCharge[];
}

const $ = dollarsToCents;

export function personasFor(taxYear: number): PersonaSpec[] {
  const y = taxYear;

  const maya: PersonaSpec = {
    id: 'maya',
    displayName: 'Maya Brooks',
    birthYear: y - 42,
    filingStatus: 'married_joint',
    state: 'NC',
    summary:
      'Married homeowner with a large mortgage bought at a high rate, two incomes, regular giving.',
    expectedFindings: [
      'Mortgage interest plus property tax plus donations likely beat the married standard deduction, so itemizing should win.',
      'Medical spending is real but well under the 7.5% of income threshold.',
    ],
    income: [
      {
        description: 'BRIGHTLINE LOGISTICS PAYROLL',
        cadence: 'biweekly',
        amountCents: $(3150),
        firstPayOn: isoDate(y, 1, 9),
      },
      {
        description: 'NORTHFIELD SCHOOLS PAYROLL',
        cadence: 'biweekly',
        amountCents: $(2050),
        firstPayOn: isoDate(y, 1, 2),
      },
    ],
    housing: {
      kind: 'mortgage',
      loan: {
        principalCents: $(420_000),
        aprPercent: 6.875,
        termMonths: 360,
        originatedOn: isoDate(y - 3, 8, 18),
        firstPaymentOn: isoDate(y - 3, 10, 1),
      },
    },
    propertyTax: { installmentCents: $(3700), months: [5, 11] },
    spending: {
      scale: 1.6,
      drives: true,
      homeowner: true,
      transitPass: false,
      cardShare: 0.7,
      autoInsuranceCents: $(188),
    },
    monthly: [
      { merchant: 'graceChurch', amountCents: $(150), day: 2, paidWith: 'checking' },
      { merchant: 'careWellPharmacy', amountCents: $(30), day: 17 },
      { merchant: 'tunewave', amountCents: $(16.99), day: 6, paidWith: 'card' },
    ],
    oneOff: [
      { merchant: 'riversideMedicine', amountCents: $(40), month: 2, day: 11 },
      { merchant: 'brightSmile', amountCents: $(180), month: 3, day: 24 },
      { merchant: 'riversideMedicine', amountCents: $(40), month: 6, day: 5 },
      { merchant: 'disasterRelief', amountCents: $(200), month: 9, day: 8 },
      { merchant: 'brightSmile', amountCents: $(180), month: 9, day: 29 },
      { merchant: 'foodBank', amountCents: $(250), month: 11, day: 24 },
      { merchant: 'literacyProject', amountCents: $(500), month: 12, day: 18 },
    ],
  };

  const jordan: PersonaSpec = {
    id: 'jordan',
    displayName: 'Jordan Reyes',
    birthYear: y - 30,
    filingStatus: 'single',
    state: 'TX',
    summary: 'Single renter who bought a new US-assembled SUV with a bank auto loan in March.',
    expectedFindings: [
      'Takes the standard deduction, but the new vehicle loan interest is deductible anyway.',
      'Cash donations are under the cap for people who do not itemize.',
    ],
    income: [
      {
        description: 'PIXELCRAFT STUDIOS PAYROLL',
        cadence: 'biweekly',
        amountCents: $(2180),
        firstPayOn: isoDate(y, 1, 9),
      },
    ],
    housing: { kind: 'rent', landlord: 'OAKRIDGE APARTMENTS', amountCents: $(1850), day: 1 },
    autoPurchase: {
      dealer: 'riverbendMotors',
      downPaymentCents: $(4000),
      loan: {
        principalCents: $(36_500),
        aprPercent: 6.9,
        termMonths: 72,
        originatedOn: isoDate(y, 3, 14),
        firstPaymentOn: isoDate(y, 4, 14),
        vehicle: { modelYear: y, condition: 'new', finalAssemblyCountry: 'US', use: 'personal' },
      },
    },
    spending: {
      scale: 1,
      drives: true,
      homeowner: false,
      transitPass: false,
      cardShare: 0.6,
      autoInsuranceCents: $(142),
    },
    monthly: [{ merchant: 'animalRescue', amountCents: $(25), day: 15, fromMonth: 6 }],
    oneOff: [
      { merchant: 'animalRescue', amountCents: $(50), month: 2, day: 14 },
      { merchant: 'riversideMedicine', amountCents: $(35), month: 4, day: 2 },
      { merchant: 'careWellPharmacy', amountCents: $(15), month: 4, day: 2 },
      { merchant: 'disasterRelief', amountCents: $(100), month: 9, day: 12 },
      { merchant: 'riversideMedicine', amountCents: $(35), month: 10, day: 20 },
      { merchant: 'foodBank', amountCents: $(75), month: 11, day: 25 },
      { merchant: 'literacyProject', amountCents: $(150), month: 12, day: 22 },
    ],
  };

  const ruth: PersonaSpec = {
    id: 'ruth',
    displayName: 'Ruth Alvarez',
    birthYear: y - 68,
    filingStatus: 'single',
    state: 'FL',
    summary:
      'Retiree, 68, home paid off, living on Social Security and a pension, high medical costs.',
    expectedFindings: [
      'Qualifies for the extra deductions for people 65 and older.',
      'Medical costs (including hearing aids and dental work) are large, but itemizing likely still loses to the standard deduction.',
      'Cash donations still count up to the cap for people who do not itemize.',
    ],
    income: [
      {
        description: 'US TREASURY SOC SEC',
        cadence: 'monthly',
        amountCents: $(2350),
        firstPayOn: isoDate(y, 1, 3),
      },
      {
        description: 'STATE RETIREMENT SYS PENSION',
        cadence: 'monthly',
        amountCents: $(1400),
        firstPayOn: isoDate(y, 1, 1),
      },
    ],
    housing: { kind: 'owned_outright' },
    propertyTax: { installmentCents: $(1700), months: [5, 11] },
    spending: {
      scale: 0.8,
      drives: true,
      homeowner: true,
      transitPass: false,
      cardShare: 0.4,
      autoInsuranceCents: $(96),
    },
    monthly: [
      { merchant: 'graceChurch', amountCents: $(100), day: 4, paidWith: 'checking' },
      { merchant: 'careWellPharmacy', amountCents: $(85), day: 10 },
    ],
    oneOff: [
      { merchant: 'riversideMedicine', amountCents: $(45), month: 1, day: 21 },
      { merchant: 'brightSmile', amountCents: $(1450), month: 3, day: 9 },
      { merchant: 'riversideMedicine', amountCents: $(45), month: 3, day: 30 },
      { merchant: 'brightSmile', amountCents: $(1450), month: 4, day: 13 },
      { merchant: 'lakeviewDermatology', amountCents: $(160), month: 5, day: 7 },
      { merchant: 'riversideMedicine', amountCents: $(45), month: 6, day: 2 },
      { merchant: 'clearSound', amountCents: $(4200), month: 6, day: 22, paidWith: 'card' },
      { merchant: 'stAnne', amountCents: $(650), month: 8, day: 19 },
      { merchant: 'riversideMedicine', amountCents: $(45), month: 9, day: 15 },
      { merchant: 'disasterRelief', amountCents: $(100), month: 9, day: 16 },
      { merchant: 'lakeviewDermatology', amountCents: $(160), month: 11, day: 3 },
      { merchant: 'riversideMedicine', amountCents: $(45), month: 12, day: 8 },
      { merchant: 'foodBank', amountCents: $(300), month: 12, day: 15 },
    ],
  };

  const sam: PersonaSpec = {
    id: 'sam',
    displayName: 'Sam Patel',
    birthYear: y - 25,
    filingStatus: 'single',
    state: 'IL',
    summary:
      'Recent graduate renting in the city, takes transit, repaying student loans held elsewhere.',
    expectedFindings: [
      'Student loan payments go to an outside servicer, so the bank sees payments but not the interest. Salsa should ask for Form 1098-E rather than guess.',
    ],
    income: [
      {
        description: 'HARBOR CITY HOSPITAL PAYROLL',
        cadence: 'biweekly',
        amountCents: $(1640),
        firstPayOn: isoDate(y, 1, 2),
      },
    ],
    housing: { kind: 'rent', landlord: 'LAKESHORE LOFTS', amountCents: $(1400), day: 1 },
    externalStudentLoan: {
      servicer: 'Keystone Student Loan Servicing',
      statementName: 'KEYSTONE STUDENT LN',
      principalCents: $(34_000),
      aprPercent: 5.5,
      termMonths: 120,
      firstPaymentOn: isoDate(y - 1, 7, 15),
    },
    spending: {
      scale: 0.7,
      drives: false,
      homeowner: false,
      transitPass: true,
      cardShare: 0.5,
    },
    monthly: [{ merchant: 'tunewave', amountCents: $(10.99), day: 21, paidWith: 'card' }],
    oneOff: [
      { merchant: 'riversideMedicine', amountCents: $(30), month: 2, day: 17 },
      { merchant: 'careWellPharmacy', amountCents: $(12), month: 2, day: 17 },
      { merchant: 'animalRescue', amountCents: $(40), month: 5, day: 9 },
      { merchant: 'foodBank', amountCents: $(60), month: 12, day: 20 },
    ],
  };

  return [maya, jordan, ruth, sam];
}

export const PERSONA_IDS = ['maya', 'jordan', 'ruth', 'sam'] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];
