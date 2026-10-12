/**
 * A small seeded random number generator. The same seed always produces the
 * same sequence, so fake data, tests and demos are reproducible.
 */

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  /** Random whole-cent amount between two dollar values. */
  cents(minDollars: number, maxDollars: number): number;
}

/** FNV-1a hash, used to turn readable seed parts into a 32-bit seed. */
export function hashSeed(...parts: ReadonlyArray<string | number>): number {
  let hash = 0x811c9dc5;
  for (const char of parts.join('|')) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: tiny, fast, and good enough for fake data (not for anything secure). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    pick: (items) => {
      if (items.length === 0) throw new Error('Cannot pick from an empty list');
      return items[int(0, items.length - 1)] as (typeof items)[number];
    },
    chance: (probability) => next() < probability,
    cents: (minDollars, maxDollars) =>
      int(Math.round(minDollars * 100), Math.round(maxDollars * 100)),
  };
}
