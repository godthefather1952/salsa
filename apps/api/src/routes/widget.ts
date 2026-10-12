import type { WidgetMeResponse, WidgetSessionResponse } from '@salsa/core';
import { and, asc, count, eq, gte, lte, max, sum } from 'drizzle-orm';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { bearerToken, findTenantByApiKey } from '../auth/api-keys';
import { signWidgetToken, verifyWidgetToken } from '../auth/widget-token';
import type { Database } from '../db/client';
import { accounts, customers, tenants, transactions } from '../db/schema';

export interface WidgetRoutesOptions {
  db: Database;
  sessionSecret: string;
  tokenTtlSeconds: number;
  /** Injectable clock for tests. Milliseconds since the epoch. */
  now: () => number;
}

const CreateSessionBody = z.object({ customerRef: z.string().min(1).max(200) });
const MeQuery = z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() });

function sendError(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.code(status).send({ error: { code, message } });
}

export const widgetRoutes: FastifyPluginAsync<WidgetRoutesOptions> = async (app, options) => {
  const { db, sessionSecret, tokenTtlSeconds, now } = options;

  /**
   * Called by the bank's server (never the browser) when a signed-in customer
   * opens the tax tab. The bank proves who it is with its API key and says
   * which of its customers this is. Salsa returns a short-lived widget token.
   */
  app.post('/v1/widget-sessions', async (request, reply) => {
    const key = bearerToken(request.headers.authorization);
    const tenant = key ? await findTenantByApiKey(db, key) : null;
    if (!tenant) {
      return sendError(
        reply,
        401,
        'invalid_api_key',
        'Send a valid bank API key as a Bearer token.',
      );
    }

    const body = CreateSessionBody.safeParse(request.body);
    if (!body.success) {
      return sendError(reply, 400, 'invalid_request', 'Body must be JSON with a customerRef.');
    }

    // Look the customer up only within the calling bank.
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.tenantId, tenant.id), eq(customers.externalRef, body.data.customerRef)),
      )
      .limit(1);
    if (!customer) {
      return sendError(
        reply,
        404,
        'customer_not_found',
        'Your bank has no customer with that ref.',
      );
    }

    const expiresAt = Math.floor(now() / 1000) + tokenTtlSeconds;
    const token = signWidgetToken(
      { tenantId: tenant.id, customerId: customer.id, expiresAt },
      sessionSecret,
    );
    const response: WidgetSessionResponse = {
      token,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
    return reply.code(201).send(response);
  });

  /** Called by the widget in the customer's browser, with the widget token. */
  app.get('/v1/widget/me', async (request, reply) => {
    const raw = bearerToken(request.headers.authorization);
    const claims = raw ? verifyWidgetToken(raw, sessionSecret, now()) : null;
    if (!claims) {
      return sendError(reply, 401, 'invalid_session', 'The widget session is missing or expired.');
    }
    const query = MeQuery.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'invalid_request', 'year must be a four-digit year.');
    }
    const taxYear = query.data.year ?? new Date(now()).getUTCFullYear();

    // Every query filters on both tenant and customer from the signed token.
    const [profile] = await db
      .select({
        displayName: customers.displayName,
        bankName: tenants.name,
        branding: tenants.branding,
      })
      .from(customers)
      .innerJoin(tenants, eq(customers.tenantId, tenants.id))
      .where(and(eq(customers.tenantId, claims.tenantId), eq(customers.id, claims.customerId)));
    if (!profile) {
      return sendError(reply, 401, 'invalid_session', 'This customer no longer exists.');
    }

    const accountRows = await db
      .select({
        id: accounts.id,
        kind: accounts.kind,
        name: accounts.name,
        mask: accounts.mask,
        loan: accounts.loan,
      })
      .from(accounts)
      .where(
        and(eq(accounts.tenantId, claims.tenantId), eq(accounts.customerId, claims.customerId)),
      )
      .orderBy(asc(accounts.kind), asc(accounts.openedOn));

    const inTaxYear = and(
      eq(transactions.tenantId, claims.tenantId),
      eq(transactions.customerId, claims.customerId),
      gte(transactions.postedOn, `${taxYear}-01-01`),
      lte(transactions.postedOn, `${taxYear}-12-31`),
    );

    const [stats] = await db
      .select({ count: count(), lastPostedOn: max(transactions.postedOn) })
      .from(transactions)
      .where(inTaxYear);

    const interestRows = await db
      .select({
        accountId: transactions.accountId,
        interestCents: sum(transactions.amountCents).mapWith(Number),
      })
      .from(transactions)
      .where(and(inTaxYear, eq(transactions.type, 'loan_interest')))
      .groupBy(transactions.accountId);
    const interestByAccount = new Map(
      interestRows.map((row) => [row.accountId, row.interestCents]),
    );

    const response: WidgetMeResponse = {
      bank: { name: profile.bankName, branding: profile.branding },
      customer: {
        displayName: profile.displayName,
        firstName: profile.displayName.split(' ')[0] ?? profile.displayName,
      },
      taxYear,
      dataThrough: stats?.lastPostedOn ?? null,
      transactionCount: stats?.count ?? 0,
      accounts: accountRows.map(({ id, kind, name, mask }) => ({ id, kind, name, mask })),
      loanInterest: accountRows
        .filter((account) => interestByAccount.has(account.id))
        .map((account) => ({
          accountId: account.id,
          accountName: account.name,
          kind: account.kind,
          mask: account.mask,
          interestCents: interestByAccount.get(account.id) ?? 0,
          originatedOn: account.loan?.originatedOn ?? null,
          vehicle: account.loan?.vehicle ?? null,
        })),
      disclaimer: 'Estimates based on your account activity. Not tax advice.',
    };
    return response;
  });
};
