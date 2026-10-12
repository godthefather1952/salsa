import type { WidgetMeResponse } from '@salsa/core';
import { DEMO_BANKS } from '@salsa/fixtures';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import type { DatabaseHandle } from '../src/db/client';
import { tenantApiKeys } from '../src/db/schema';
import { seedDemoData } from '../src/db/seed';
import { memoryDatabase, TEST_SECRET } from './helpers';

const [TIDEWATER, SUMMIT] = DEMO_BANKS;
const NOW = Date.UTC(2026, 9, 12, 16, 0, 0); // 2026-10-12

let handle: DatabaseHandle;
let app: FastifyInstance;
let clock = NOW;

beforeAll(async () => {
  handle = await memoryDatabase();
  await seedDemoData(handle.db, { taxYear: 2026, through: '2026-10-12' });
  app = buildApp({
    db: handle.db,
    sessionSecret: TEST_SECRET,
    tokenTtlSeconds: 900,
    logLevel: 'silent',
    now: () => clock,
  });
});

afterAll(async () => {
  await app.close();
  await handle.close();
});

function createSession(apiKey: string | null, customerRef: unknown) {
  return app.inject({
    method: 'POST',
    url: '/v1/widget-sessions',
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    payload: { customerRef },
  });
}

async function tokenFor(apiKey: string, customerRef: string): Promise<string> {
  const response = await createSession(apiKey, customerRef);
  expect(response.statusCode).toBe(201);
  return response.json().token;
}

function me(token: string | null) {
  return app.inject({
    method: 'GET',
    url: '/v1/widget/me?year=2026',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('POST /v1/widget-sessions (bank server to salsa)', () => {
  it('issues a 15 minute token for a customer of the calling bank', async () => {
    const response = await createSession(TIDEWATER.apiKey, 'cust_maya');
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.token).toMatch(/^wt1\./);
    expect(body.expiresAt).toBe(new Date(NOW + 900_000).toISOString());
  });

  it('rejects requests without a key or with an unknown key', async () => {
    expect((await createSession(null, 'cust_maya')).statusCode).toBe(401);
    expect((await createSession('sk_test_made_up', 'cust_maya')).statusCode).toBe(401);
  });

  it('rejects a bad body and unknown customers', async () => {
    expect((await createSession(TIDEWATER.apiKey, '')).statusCode).toBe(400);
    expect((await createSession(TIDEWATER.apiKey, 'cust_nobody')).statusCode).toBe(404);
  });

  it('stops working once the key is revoked', async () => {
    const key = 'sk_test_temporary_key_for_revocation';
    const { hashApiKey } = await import('../src/auth/api-keys');
    const [tenantRow] = await handle.db
      .select({ tenantId: tenantApiKeys.tenantId })
      .from(tenantApiKeys)
      .limit(1);
    const [row] = await handle.db
      .insert(tenantApiKeys)
      .values({
        tenantId: tenantRow?.tenantId ?? '',
        label: 'temp',
        prefix: 'sk_test_temp…',
        keyHash: hashApiKey(key),
      })
      .returning({ id: tenantApiKeys.id });
    expect((await createSession(key, 'cust_sam')).statusCode).toBe(201);

    await handle.db
      .update(tenantApiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(tenantApiKeys.id, row?.id ?? ''));
    expect((await createSession(key, 'cust_sam')).statusCode).toBe(401);
  });
});

describe('GET /v1/widget/me (widget in the browser)', () => {
  it("returns the customer's bank branding, accounts and loan interest", async () => {
    const response = await me(await tokenFor(TIDEWATER.apiKey, 'cust_maya'));
    expect(response.statusCode).toBe(200);
    const body: WidgetMeResponse = response.json();

    expect(body.bank).toEqual({ name: TIDEWATER.name, branding: TIDEWATER.branding });
    expect(body.customer).toEqual({ displayName: 'Maya Brooks', firstName: 'Maya' });
    expect(body.taxYear).toBe(2026);
    expect(body.dataThrough?.startsWith('2026-10')).toBe(true);
    expect((body.dataThrough ?? '') <= '2026-10-12').toBe(true);
    expect(body.accounts.map((account) => account.kind)).toEqual([
      'checking',
      'credit_card',
      'mortgage',
    ]);
    expect(body.loanInterest).toHaveLength(1);
    expect(body.loanInterest[0]?.kind).toBe('mortgage');
    expect(body.loanInterest[0]?.interestCents).toBeGreaterThan(2_000_000);
    expect(body.disclaimer).toMatch(/not tax advice/i);
  });

  it('includes the vehicle details that matter for car loan interest', async () => {
    const body: WidgetMeResponse = (await me(await tokenFor(SUMMIT.apiKey, 'cust_jordan'))).json();
    expect(body.loanInterest[0]?.vehicle).toMatchObject({
      condition: 'new',
      finalAssemblyCountry: 'US',
    });
  });

  it('shows each bank only its own customer, even with the same customer ref', async () => {
    const atTidewater: WidgetMeResponse = (
      await me(await tokenFor(TIDEWATER.apiKey, 'cust_maya'))
    ).json();
    const atSummit: WidgetMeResponse = (
      await me(await tokenFor(SUMMIT.apiKey, 'cust_maya'))
    ).json();

    expect(atTidewater.bank.name).toBe(TIDEWATER.name);
    expect(atSummit.bank.name).toBe(SUMMIT.name);
    const tidewaterIds = new Set(atTidewater.accounts.map((account) => account.id));
    expect(atSummit.accounts.some((account) => tidewaterIds.has(account.id))).toBe(false);
  });

  it('rejects missing, tampered and expired tokens', async () => {
    const token = await tokenFor(TIDEWATER.apiKey, 'cust_ruth');
    expect((await me(null)).statusCode).toBe(401);
    expect((await me(`${token}x`)).statusCode).toBe(401);
    expect((await me(TIDEWATER.apiKey)).statusCode).toBe(401);

    clock = NOW + 901_000;
    try {
      expect((await me(token)).statusCode).toBe(401);
    } finally {
      clock = NOW;
    }
  });
});
