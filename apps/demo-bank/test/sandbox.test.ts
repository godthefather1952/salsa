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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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

  describe('widget-to-bank messages', () => {
    // Execute the script served by the real bank route. The DOM and message delivery
    // are mocked; this checks the host contract, not browser postMessage routing.
    async function loadHost() {
      const response = await bank.inject({ url: '/tidewater/tax', cookies: await signIn('maya') });
      expect(response.statusCode).toBe(200);
      const iframe = response.body.match(/<iframe\b[^>]*>/)?.[0] ?? '';
      expect(iframe).toContain('class="salsa-frame"');
      const origin = iframe.match(/data-origin="([^"]+)"/)?.[1];
      expect(origin).toBe(new URL(WIDGET_URL).origin);
      const src = iframe.match(/src="([^"]+)"/)?.[1] ?? '';
      expect(new URL(src).origin).toBe(origin);
      const script = response.body.match(/<script>([\s\S]*?)<\/script>/)?.[1];
      expect(script).toBeTruthy();

      const contentWindow = {};
      const frame = {
        dataset: { origin },
        contentWindow,
        style: { height: '300px' },
      };
      type HostEvent = { origin: string; source: unknown; data: unknown };
      const querySelector = vi.fn(() => frame);
      const addEventListener = vi.fn<(type: string, handler: (event: HostEvent) => void) => void>();
      const reload = vi.fn();
      runInNewContext(script ?? '', {
        document: { querySelector },
        window: { addEventListener, location: { reload } },
      });
      expect(querySelector).toHaveBeenCalledExactlyOnceWith('.salsa-frame');
      expect(addEventListener).toHaveBeenCalledExactlyOnceWith('message', expect.any(Function));
      const onMessage = addEventListener.mock.calls[0]?.[1];
      if (!onMessage || !origin) throw new Error('Widget host did not initialize');
      expect(frame.style.height).toBe('300px');
      expect(reload).not.toHaveBeenCalled();

      return {
        frame,
        reload,
        origin,
        contentWindow,
        send: (data: unknown, eventOrigin = origin, source: unknown = contentWindow) =>
          onMessage({ data, origin: eventOrigin, source }),
      };
    }

    it.each([100, 450, 10000])('accepts a trusted integer height of %i', async (height) => {
      const host = await loadHost();
      host.send({ type: 'salsa:resize', height });
      expect(host.frame.style.height).toBe(`${height}px`);
      expect(host.reload).not.toHaveBeenCalled();
    });

    it.each([
      ['below minimum', 99],
      ['above maximum', 10001],
      ['zero', 0],
      ['negative', -1],
      ['fractional', 450.5],
      ['NaN', Number.NaN],
      ['positive infinity', Number.POSITIVE_INFINITY],
      ['negative infinity', Number.NEGATIVE_INFINITY],
      ['numeric string', '450'],
      ['CSS string', '999999px'],
      ['undefined', undefined],
      ['null', null],
      ['boolean', true],
      ['object', {}],
      ['array', [450]],
    ])('ignores a trusted resize with %s height', async (_label, height) => {
      const host = await loadHost();
      host.send({ type: 'salsa:resize', height });
      expect(host.frame.style.height).toBe('300px');
      expect(host.reload).not.toHaveBeenCalled();
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['string', 'salsa:reload'],
      ['number', 450],
      ['boolean', true],
      ['array', []],
      ['array with resize fields', Object.assign([], { type: 'salsa:resize', height: 450 })],
      ['array with reload fields', Object.assign([], { type: 'salsa:reload' })],
      ['missing type', { height: 450 }],
      ['unknown type', { type: 'salsa:unknown', height: 450 }],
      ['missing height', { type: 'salsa:resize' }],
    ])('ignores a malformed trusted message: %s', async (_label, data) => {
      const host = await loadHost();
      host.send(data);
      expect(host.frame.style.height).toBe('300px');
      expect(host.reload).not.toHaveBeenCalled();
    });

    describe.each(['salsa:resize', 'salsa:reload'])('%s trust boundary', (type) => {
      it('rejects the expected iframe with a wrong origin', async () => {
        const host = await loadHost();
        host.send({ type, height: 450 }, 'https://attacker.example', host.contentWindow);
        expect(host.frame.style.height).toBe('300px');
        expect(host.reload).not.toHaveBeenCalled();
      });

      it('rejects another window at the expected origin', async () => {
        const host = await loadHost();
        host.send({ type, height: 450 }, host.origin, {});
        expect(host.frame.style.height).toBe('300px');
        expect(host.reload).not.toHaveBeenCalled();
      });

      it('rejects a missing source at the expected origin', async () => {
        const host = await loadHost();
        host.send({ type, height: 450 }, host.origin, null);
        expect(host.frame.style.height).toBe('300px');
        expect(host.reload).not.toHaveBeenCalled();
      });
    });

    it('reloads exactly once for a trusted reload message without resizing', async () => {
      const host = await loadHost();
      host.send({ type: 'salsa:reload' });
      expect(host.reload).toHaveBeenCalledTimes(1);
      expect(host.frame.style.height).toBe('300px');
    });
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
