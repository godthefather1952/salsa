/**
 * End to end: a real salsa API (in-memory database) and the fake bank, wired
 * together over HTTP exactly as `pnpm dev` runs them.
 */
import type { AddressInfo } from 'node:net';
import { runInNewContext } from 'node:vm';
import { buildApp } from '@salsa/api/app';
import { type DatabaseHandle, openDatabase } from '@salsa/api/db';
import { seedDemoData } from '@salsa/api/seed';
import type { WidgetMeResponse } from '@salsa/core';
import { DEMO_BANKS } from '@salsa/fixtures';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildBankApp } from '../src/app';
import { customersOf } from '../src/core-banking';
import { escapeHtml, html } from '../src/html';

const TODAY = '2026-10-12';
const NOW = Date.UTC(2026, 9, 12, 16, 0, 0);
const WIDGET_URL = 'http://localhost:5173';
const [TIDEWATER] = DEMO_BANKS;

let database: DatabaseHandle;
let api: FastifyInstance;
let apiUrl: string;
let bank: FastifyInstance;

beforeAll(async () => {
  database = await openDatabase('pglite://memory');
  await database.migrate();
  await seedDemoData(database.db, { taxYear: 2026, through: TODAY });
  api = buildApp({
    db: database.db,
    sessionSecret: 'sandbox-test-secret-at-least-32-characters',
    logLevel: 'silent',
    now: () => NOW,
  });
  await api.listen({ host: '127.0.0.1', port: 0 });
  apiUrl = `http://127.0.0.1:${(api.server.address() as AddressInfo).port}`;
  bank = buildBankApp({ salsaApiUrl: apiUrl, salsaWidgetUrl: WIDGET_URL, today: () => TODAY });
});

afterAll(async () => {
  await bank.close();
  await api.close();
  await database.close();
});

async function signIn(persona: string): Promise<Record<string, string>> {
  const response = await bank.inject({
    method: 'POST',
    url: '/tidewater/sign-in',
    payload: `persona=${persona}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
  expect(response.statusCode).toBe(303);
  expect(response.headers.location).toBe('/tidewater/accounts');
  return Object.fromEntries(response.cookies.map((c) => [c.name, c.value]));
}

describe('the fake bank', () => {
  it('lists both banks and sees that salsa is running', async () => {
    const response = await bank.inject({ url: '/' });
    expect(response.body).toContain('Tidewater Demo Bank');
    expect(response.body).toContain('Summit Demo Credit Union');
    expect(response.body).toContain('The salsa API is running.');
  });

  it('offers the four demo customers at sign-in', async () => {
    const response = await bank.inject({ url: '/tidewater' });
    for (const name of ['Maya Brooks', 'Jordan Reyes', 'Ruth Alvarez', 'Sam Patel']) {
      expect(response.body).toContain(name);
    }
  });

  it('sends signed-out visitors to sign-in', async () => {
    const response = await bank.inject({ url: '/tidewater/accounts' });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/tidewater');
  });

  it("shows a signed-in customer's accounts", async () => {
    const response = await bank.inject({
      url: '/tidewater/accounts',
      cookies: await signIn('maya'),
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Welcome back, Maya');
    expect(response.body).toContain('Home Mortgage');
    expect(response.body).toContain('Open tax savings');
  });

  it('computes believable balances', () => {
    for (const bankDef of DEMO_BANKS) {
      for (const customer of customersOf(bankDef, TODAY)) {
        const checking = customer.accounts.find((account) => account.kind === 'checking');
        expect(checking?.balanceCents).toBeGreaterThan(0);
      }
    }
    const maya = customersOf(TIDEWATER, TODAY).find((c) => c.personaId === 'maya');
    const mortgage = maya?.accounts.find((account) => account.kind === 'mortgage');
    expect(mortgage?.balanceCents).toBeLessThan(42_000_000);
    expect(mortgage?.balanceCents).toBeGreaterThan(38_000_000);
  });
});

describe('the salsa integration', () => {
  it('embeds the widget with a token that opens only this customer', async () => {
    const response = await bank.inject({ url: '/tidewater/tax', cookies: await signIn('maya') });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');

    const src = response.body.match(/<iframe[^>]+src="([^"]+)"/)?.[1] ?? '';
    expect(src.startsWith(`${WIDGET_URL}/#token=`)).toBe(true);
    const token = decodeURIComponent(src.split('#token=')[1] ?? '');

    // The widget would make this call from the browser.
    const me = await fetch(`${apiUrl}/v1/widget/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.status).toBe(200);
    const body = (await me.json()) as WidgetMeResponse;
    expect(body.bank.name).toBe('Tidewater Demo Bank');
    expect(body.customer.displayName).toBe('Maya Brooks');
    expect(body.loanInterest[0]?.kind).toBe('mortgage');
  });

  it('accepts only bounded widget resize messages from the trusted iframe', async () => {
    const response = await bank.inject({ url: '/tidewater/tax', cookies: await signIn('maya') });
    const script = response.body.match(/<script>([\\s\\S]*?)<\\/script>/)?.[1];
    expect(script).toBeTruthy();

    const contentWindow = {};
    const frame = {
      dataset: { origin: new URL(WIDGET_URL).origin },
      contentWindow,
      style: { height: '300px' },
    };
    let onMessage: (event: { origin: string; source: unknown; data: unknown }) => void = () => {};
    let reloads = 0;
    runInNewContext(script ?? '', {
      document: { querySelector: () => frame },
      window: {
        addEventListener: (_type: string, handler: typeof onMessage) => { onMessage = handler; },
        location: { reload: () => { reloads++; } },
      },
    });

    const send = (data: unknown, origin = frame.dataset.origin, source: unknown = contentWindow) =>
      onMessage({ data, origin, source });

    send({ type: 'salsa:resize', height: 450 }, 'https://attacker.example');
    send({ type: 'salsa:resize', height: 450 }, frame.dataset.origin, {});
    send({ type: 'salsa:resize', height: '999999px' });
    send({ type: 'salsa:resize', height: Number.POSITIVE_INFINITY });
    send({ type: 'salsa:resize', height: 10001 });
    send({ type: 'salsa:resize', height: 1 });
    send(null);
    expect(frame.style.height).toBe('300px');
    send({ type: 'salsa:resize', height: 450 });
    expect(frame.style.height).toBe('450px');

    send({ type: 'salsa:reload' }, 'https://attacker.example');
    expect(reloads).toBe(0);
    send({ type: 'salsa:reload' });
    expect(reloads).toBe(1);
  });

  it("never puts the bank's API key in the page", async () => {
    const response = await bank.inject({ url: '/tidewater/tax', cookies: await signIn('jordan') });
    expect(response.body).not.toContain(TIDEWATER.apiKey);
  });

  it('shows a calm message, plus developer details, when salsa is down', async () => {
    const offline = buildBankApp({
      salsaApiUrl: 'http://127.0.0.1:9',
      salsaWidgetUrl: WIDGET_URL,
      today: () => TODAY,
    });
    const login = await offline.inject({
      method: 'POST',
      url: '/tidewater/sign-in',
      payload: 'persona=ruth',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    const cookies = Object.fromEntries(login.cookies.map((c) => [c.name, c.value]));
    const response = await offline.inject({ url: '/tidewater/tax', cookies });
    expect(response.body).toContain("Tax savings isn't available right now");
    expect(response.body).toContain('Could not reach the salsa API');
    expect(response.body).not.toContain('<iframe');
    await offline.close();
  });
});

describe('html', () => {
  it('escapes interpolated values', () => {
    expect(html`<p>${'<script>alert(1)</script>'}</p>`.value).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
    expect(escapeHtml(`"'&`)).toBe('&quot;&#39;&amp;');
  });
});
