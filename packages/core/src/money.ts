/**
 * Money is always an integer number of cents. Never store or add dollars as
 * floating point numbers: 0.1 + 0.2 !== 0.3.
 */

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function sumCents(values: Iterable<number>): number {
  let total = 0;
  for (const value of values) {
    if (!Number.isSafeInteger(value)) {
      throw new Error(`Expected integer cents, got ${value}`);
    }
    total += value;
  }
  return total;
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}
