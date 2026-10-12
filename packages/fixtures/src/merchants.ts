/**
 * Fictional merchants with real merchant category codes (MCCs). Card networks
 * attach an MCC to every card purchase, and it is one of the strongest signals
 * the categorizer will have. ACH payments (rent, loan servicers) have no MCC.
 */

/**
 * The true category of each fake transaction. This is the answer key used to
 * test the categorizer. It is never stored as bank data, because a real bank
 * feed does not come with one.
 */
export const TRUTH_CATEGORIES = [
  'income',
  'rent',
  'loan_payment',
  'mortgage_interest',
  'auto_loan_interest',
  'loan_principal',
  'vehicle_purchase',
  'property_tax',
  'charity',
  'medical',
  'student_loan_payment',
  'groceries',
  'fuel',
  'dining',
  'utilities',
  'phone',
  'subscriptions',
  'shopping',
  'home_improvement',
  'insurance',
  'transit',
  'card_payment',
] as const;
export type TruthCategory = (typeof TRUTH_CATEGORIES)[number];

export interface Merchant {
  name: string;
  /** How the merchant appears on a statement. */
  statementName: string;
  mcc: string | null;
  category: TruthCategory;
}

export const MERCHANTS = {
  freshFields: {
    name: 'Fresh Fields Market',
    statementName: 'FRESH FIELDS MKT #0412',
    mcc: '5411',
    category: 'groceries',
  },
  valueBasket: {
    name: 'Value Basket Grocery',
    statementName: 'VALUE BASKET #212',
    mcc: '5411',
    category: 'groceries',
  },
  quickFuel: {
    name: 'QuickFuel',
    statementName: 'QUICKFUEL #3381',
    mcc: '5541',
    category: 'fuel',
  },
  lakesideGas: {
    name: 'Lakeside Gas & Go',
    statementName: 'LAKESIDE GAS N GO',
    mcc: '5541',
    category: 'fuel',
  },
  lunaTrattoria: {
    name: 'Luna Trattoria',
    statementName: 'LUNA TRATTORIA',
    mcc: '5812',
    category: 'dining',
  },
  copperPot: {
    name: 'The Copper Pot',
    statementName: 'THE COPPER POT',
    mcc: '5812',
    category: 'dining',
  },
  saigonNoodle: {
    name: 'Saigon Noodle House',
    statementName: 'SAIGON NOODLE HSE',
    mcc: '5812',
    category: 'dining',
  },
  beanThere: {
    name: 'Bean There Coffee',
    statementName: 'BEAN THERE COFFEE',
    mcc: '5814',
    category: 'dining',
  },
  tacoCorner: {
    name: 'Taco Corner',
    statementName: 'TACO CORNER #18',
    mcc: '5814',
    category: 'dining',
  },
  cityPower: {
    name: 'City Power & Light',
    statementName: 'CITY POWER LIGHT',
    mcc: '4900',
    category: 'utilities',
  },
  metroWater: {
    name: 'Metro Water Authority',
    statementName: 'METRO WATER AUTH',
    mcc: '4900',
    category: 'utilities',
  },
  clearwave: {
    name: 'Clearwave Wireless',
    statementName: 'CLEARWAVE WIRELESS',
    mcc: '4814',
    category: 'phone',
  },
  streamBox: {
    name: 'StreamBox',
    statementName: 'STREAMBOX.TV',
    mcc: '4899',
    category: 'subscriptions',
  },
  tunewave: {
    name: 'Tunewave Music',
    statementName: 'TUNEWAVE MUSIC',
    mcc: '4899',
    category: 'subscriptions',
  },
  threadline: {
    name: 'Threadline Apparel',
    statementName: 'THREADLINE APPAREL',
    mcc: '5651',
    category: 'shopping',
  },
  parcelMarket: {
    name: 'Parcel Market',
    statementName: 'PARCELMKT*ORDER',
    mcc: '5999',
    category: 'shopping',
  },
  homeBuild: {
    name: 'HomeBuild Supply',
    statementName: 'HOMEBUILD SUPPLY #77',
    mcc: '5200',
    category: 'home_improvement',
  },
  shieldInsurance: {
    name: 'Shield Auto Insurance',
    statementName: 'SHIELD AUTO INS',
    mcc: '6300',
    category: 'insurance',
  },
  metroTransit: {
    name: 'Metro Transit',
    statementName: 'METRO TRANSIT PASS',
    mcc: '4111',
    category: 'transit',
  },
  riverbendMotors: {
    name: 'Riverbend Motors',
    statementName: 'RIVERBEND MOTORS',
    mcc: '5511',
    category: 'vehicle_purchase',
  },
  countyTax: {
    name: 'County Tax Commissioner',
    statementName: 'COUNTY TAX COMM PROPERTY TAX',
    mcc: '9311',
    category: 'property_tax',
  },
  // Medical
  careWellPharmacy: {
    name: 'CareWell Pharmacy',
    statementName: 'CAREWELL PHARMACY #904',
    mcc: '5912',
    category: 'medical',
  },
  riversideMedicine: {
    name: 'Riverside Family Medicine',
    statementName: 'RIVERSIDE FAMILY MED',
    mcc: '8011',
    category: 'medical',
  },
  lakeviewDermatology: {
    name: 'Lakeview Dermatology',
    statementName: 'LAKEVIEW DERMATOLOGY',
    mcc: '8011',
    category: 'medical',
  },
  brightSmile: {
    name: 'Bright Smile Dental',
    statementName: 'BRIGHT SMILE DENTAL',
    mcc: '8021',
    category: 'medical',
  },
  stAnne: {
    name: 'St. Anne Regional Medical Center',
    statementName: 'ST ANNE REGIONAL MED CTR',
    mcc: '8062',
    category: 'medical',
  },
  clearSound: {
    name: 'ClearSound Hearing Center',
    statementName: 'CLEARSOUND HEARING',
    mcc: '8099',
    category: 'medical',
  },
  // Charities and religious organizations
  foodBank: {
    name: 'Community Food Bank',
    statementName: 'COMMUNITY FOOD BANK',
    mcc: '8398',
    category: 'charity',
  },
  animalRescue: {
    name: 'Animal Rescue League',
    statementName: 'ANIMAL RESCUE LEAGUE',
    mcc: '8398',
    category: 'charity',
  },
  literacyProject: {
    name: "Children's Literacy Project",
    statementName: 'CHILDRENS LITERACY PROJ',
    mcc: '8398',
    category: 'charity',
  },
  disasterRelief: {
    name: 'Disaster Relief Fund',
    statementName: 'DISASTER RELIEF FUND',
    mcc: '8398',
    category: 'charity',
  },
  graceChurch: {
    name: 'Grace Community Church',
    statementName: 'GRACE COMMUNITY CHURCH',
    mcc: '8661',
    category: 'charity',
  },
} as const satisfies Record<string, Merchant>;

export type MerchantKey = keyof typeof MERCHANTS;
