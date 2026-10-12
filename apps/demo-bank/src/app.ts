import { readFileSync } from 'node:fs';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import { type IsoDate, todayIso } from '@salsa/core';
import type { DemoBank } from '@salsa/fixtures';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { type BankCustomer, customersOf, findBank, findCustomer } from './core-banking';
import { createWidgetSession, salsaIsHealthy } from './salsa-client';
import { accountsPage, chooserPage, notFoundPage, signInPage, taxPage } from './views';

export interface BankAppOptions {
  /** Where the bank's server reaches the salsa API (server to server). */
  salsaApiUrl: string;
  /** Where customers' browsers load the salsa widget from. */
  salsaWidgetUrl: string;
  /** The last day of data the bank has. Defaults to today. */
  today?: () => IsoDate;
  logger?: boolean;
}

const BANK_CSS = readFileSync(new URL('./assets/bank.css', import.meta.url), 'utf8');

const cookieName = (bank: DemoBank) => `demo_${bank.slug}_customer`;

export function buildBankApp(options: BankAppOptions): FastifyInstance {
  const { salsaApiUrl, salsaWidgetUrl, today = todayIso } = options;
  const widgetOrigin = new URL(salsaWidgetUrl).origin;
  const app = Fastify({ logger: options.logger ?? false });
  app.register(cookie);
  app.register(formbody);

  const sendHtml = (reply: FastifyReply, body: string, status = 200) =>
    reply.code(status).type('text/html; charset=utf-8').send(body);

  /** Resolves the bank in the URL and the signed-in customer, or redirects. */
  function signedIn(
    request: FastifyRequest<{ Params: { bank: string } }>,
    reply: FastifyReply,
  ): { bank: DemoBank; customer: BankCustomer } | null {
    const bank = findBank(request.params.bank);
    if (!bank) {
      sendHtml(reply, notFoundPage(), 404);
      return null;
    }
    const personaId = request.cookies[cookieName(bank)];
    const customer = personaId ? findCustomer(bank, personaId, today()) : undefined;
    if (!customer) {
      reply.redirect(`/${bank.slug}`);
      return null;
    }
    return { bank, customer };
  }

  app.get('/', async (_request, reply) =>
    sendHtml(reply, chooserPage(await salsaIsHealthy(salsaApiUrl))),
  );

  app.get('/assets/bank.css', async (_request, reply) =>
    reply.type('text/css; charset=utf-8').send(BANK_CSS),
  );

  app.get<{ Params: { bank: string } }>('/:bank', async (request, reply) => {
    const bank = findBank(request.params.bank);
    if (!bank) return sendHtml(reply, notFoundPage(), 404);
    if (request.cookies[cookieName(bank)]) return reply.redirect(`/${bank.slug}/accounts`);
    return sendHtml(reply, signInPage(bank, customersOf(bank, today())));
  });

  app.post<{ Params: { bank: string }; Body: { persona?: string } }>(
    '/:bank/sign-in',
    async (request, reply) => {
      const bank = findBank(request.params.bank);
      if (!bank) return sendHtml(reply, notFoundPage(), 404);
      const customer = findCustomer(bank, request.body?.persona ?? '', today());
      if (!customer) return reply.redirect(`/${bank.slug}`);
      reply.setCookie(cookieName(bank), customer.personaId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
      return reply.redirect(`/${bank.slug}/accounts`, 303);
    },
  );

  app.post<{ Params: { bank: string } }>('/:bank/sign-out', async (request, reply) => {
    const bank = findBank(request.params.bank);
    if (!bank) return sendHtml(reply, notFoundPage(), 404);
    reply.clearCookie(cookieName(bank), { path: '/' });
    return reply.redirect(`/${bank.slug}`, 303);
  });

  app.get<{ Params: { bank: string } }>('/:bank/accounts', async (request, reply) => {
    const session = signedIn(request, reply);
    if (!session) return reply;
    return sendHtml(reply, accountsPage(session.bank, session.customer));
  });

  /**
   * The integration point. The bank's server asks salsa for a widget token for
   * this customer, using the bank's secret key, then the page loads salsa's
   * widget in an iframe with that token. The key never reaches the browser.
   */
  app.get<{ Params: { bank: string } }>('/:bank/tax', async (request, reply) => {
    const session = signedIn(request, reply);
    if (!session) return reply;
    const { bank, customer } = session;

    const result = await createWidgetSession(salsaApiUrl, bank.apiKey, customer.customerRef);
    if (!result.ok) {
      request.log.warn({ reason: result.reason }, 'salsa widget session failed');
    }
    const widget = result.ok
      ? {
          ok: true as const,
          src: `${salsaWidgetUrl}/#token=${encodeURIComponent(result.token)}`,
          origin: widgetOrigin,
        }
      : result;
    // The page holds a token, so browsers and proxies must not cache it.
    reply.header('cache-control', 'no-store');
    return sendHtml(reply, taxPage(bank, customer, widget));
  });

  app.setNotFoundHandler((_request, reply) => sendHtml(reply, notFoundPage(), 404));

  return app;
}
