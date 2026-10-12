import { describe, expect, it } from 'vitest';
import { addDays, addMonths, dollarsToCents, formatCents, isoDate, sumCents } from '../src';

describe('money', () => {
  it('converts dollars to integer cents without float drift', () => {
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
    expect(dollarsToCents(1199.1)).toBe(119910);
  });

  it('refuses to add non-integer cents', () => {
    expect(() => sumCents([100, 0.5])).toThrow();
    expect(sumCents([100, -40, 5])).toBe(65);
  });

  it('formats cents as US dollars', () => {
    expect(formatCents(1610000)).toBe('$16,100.00');
    expect(formatCents(-4599)).toBe('-$45.99');
  });
});

describe('dates', () => {
  it('clamps days past the end of the month', () => {
    expect(isoDate(2026, 2, 31)).toBe('2026-02-28');
    expect(isoDate(2028, 2, 31)).toBe('2028-02-29');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('adds months keeping the day of month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-11-14', 3)).toBe('2027-02-14');
    expect(addMonths('2026-03-14', -3)).toBe('2025-12-14');
  });
});
