import { expect } from 'vitest';
import { openDatabase } from '../src/db/client';

/** Asserts a query fails because of one specific database constraint, not some other error. */
export async function expectConstraintViolation(query: PromiseLike<unknown>, constraint: string) {
  let caught: unknown;
  try {
    await query;
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected ${constraint} to reject the query`).toBeInstanceOf(Error);
  // Drizzle wraps the driver's error; Postgres names the constraint in the cause.
  const cause = (caught as Error & { cause?: unknown }).cause;
  const message = cause instanceof Error ? cause.message : (caught as Error).message;
  expect(message).toContain(constraint);
}

/** A fresh, migrated, in-memory Postgres for each test file. */
export async function memoryDatabase() {
  const handle = await openDatabase('pglite://memory');
  await handle.migrate();
  return handle;
}
