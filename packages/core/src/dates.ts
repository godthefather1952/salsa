/**
 * Calendar dates are ISO strings ("2026-03-14") with no time zone, matching how
 * banks report a transaction's posted date and how Postgres `date` columns work.
 */

export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Builds a date from a 1-based month. Days past the end of the month clamp to its last day. */
export function isoDate(year: number, month: number, day: number): IsoDate {
  const clamped = Math.min(day, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
}

export function parseIsoDate(value: IsoDate): { year: number; month: number; day: number } {
  const match = ISO_DATE.exec(value);
  if (!match) throw new Error(`Not an ISO date: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const { year, month, day } = parseIsoDate(value);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** Moves by whole months, keeping the day of month (clamped to the month's length). */
export function addMonths(value: IsoDate, months: number): IsoDate {
  const { year, month, day } = parseIsoDate(value);
  const index = year * 12 + (month - 1) + months;
  return isoDate(Math.floor(index / 12), (index % 12) + 1, day);
}

/** ISO dates sort correctly as strings, so plain comparison works. */
export function isWithin(value: IsoDate, start: IsoDate, end: IsoDate): boolean {
  return value >= start && value <= end;
}
