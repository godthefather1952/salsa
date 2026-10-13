import { formatCents, type IsoDate } from '@salsa/core';
import { DEMO_BANKS, type DemoBank, type GeneratedTransaction } from '@salsa/fixtures';
import type { BankAccountView, BankCustomer } from './core-banking';
import { html, type SafeHtml } from './html';

const ACCOUNT_KIND_LABELS: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit card',
  mortgage: 'Mortgage',
  auto_loan: 'Auto loan',
  student_loan: 'Student loan',
};

const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatShortDate(iso: IsoDate): string {
  return shortDate.format(new Date(`${iso}T00:00:00Z`));
}

function signedAmount(cents: number): string {
  return cents > 0 ? `+${formatCents(cents)}` : formatCents(cents);
}

function themeStyle(bank: DemoBank): string {
  return `--brand:${bank.branding.primaryColor};--brand-accent:${bank.branding.accentColor}`;
}

function page(options: {
  title: string;
  bank?: DemoBank;
  body: SafeHtml;
  bodyClass?: string;
}): string {
  const { title, bank, body, bodyClass } = options;
  return html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/assets/bank.css" />
  </head>
  <body class="${bodyClass ?? ''}" style="${bank ? themeStyle(bank) : ''}">
    ${body}
  </body>
</html>`.value;
}

function demoNote(bank: DemoBank): SafeHtml {
  return html`<p class="demo-note">
    ${bank.name} is a fictional bank for testing salsa. The people and money here are made up.
    <a href="/">Switch bank</a>
  </p>`;
}

function bankChrome(
  bank: DemoBank,
  customer: BankCustomer,
  active: 'accounts' | 'tax',
  content: SafeHtml,
): SafeHtml {
  const link = (href: string, label: string, key: typeof active) =>
    html`<a href="${href}" ${active === key ? html`aria-current="page"` : ''}>${label}</a>`;
  return html`
    <header class="bank-bar">
      <div class="bar-inner">
        <a class="wordmark" href="/${bank.slug}/accounts">${bank.name}</a>
        <nav aria-label="Online banking">
          ${link(`/${bank.slug}/accounts`, 'Accounts', 'accounts')}
          ${link(`/${bank.slug}/tax`, 'Tax savings', 'tax')}
        </nav>
        <form class="who" method="post" action="/${bank.slug}/sign-out">
          <span>${customer.displayName}</span>
          <button type="submit">Sign out</button>
        </form>
      </div>
    </header>
    ${demoNote(bank)}
    <main class="page">${content}</main>`;
}

export function chooserPage(salsaUp: boolean): string {
  const tiles = DEMO_BANKS.map(
    (bank) => html`
      <li>
        <a class="bank-tile" href="/${bank.slug}" style="${themeStyle(bank)}">
          <span class="tile-name">${bank.name}</span>
          <span class="tile-tagline">${bank.tagline}</span>
        </a>
      </li>`,
  );
  return page({
    title: 'salsa sandbox',
    bodyClass: 'sandbox',
    body: html`
      <main class="sandbox-main">
        <p class="sandbox-name">salsa sandbox</p>
        <h1>Pick a bank to sign in to</h1>
        <p class="sandbox-intro">
          Both banks are fictional. Each one runs salsa inside its online banking, the way a real
          bank would. Sign in as one of four made-up customers and open Tax savings.
        </p>
        <ul class="bank-tiles">
          ${tiles}
        </ul>
        <p class="api-status ${salsaUp ? 'up' : 'down'}">
          ${
            salsaUp
              ? 'The salsa API is running.'
              : 'The salsa API is not reachable. Run `pnpm dev` from the repo root, and `pnpm db:setup` once before that.'
          }
        </p>
      </main>`,
  });
}

export function signInPage(bank: DemoBank, customers: BankCustomer[]): string {
  const choices = customers.map(
    (customer) => html`
      <li>
        <button type="submit" name="persona" value="${customer.personaId}">
          <span class="choice-name">${customer.displayName}</span>
          <span class="choice-summary">${customer.summary}</span>
        </button>
      </li>`,
  );
  return page({
    title: `Sign in | ${bank.name}`,
    bank,
    bodyClass: 'signin',
    body: html`
      <header class="bank-bar">
        <div class="bar-inner"><span class="wordmark">${bank.name}</span></div>
      </header>
      ${demoNote(bank)}
      <main class="signin-main">
        <h1>Sign in to online banking</h1>
        <p>This demo bank has no passwords. Choose a customer to sign in as.</p>
        <form method="post" action="/${bank.slug}/sign-in">
          <ul class="choices">
            ${choices}
          </ul>
        </form>
      </main>`,
  });
}

function accountRow(account: BankAccountView): SafeHtml {
  return html`
    <li class="account">
      <div>
        <span class="account-name">${account.name}</span>
        <span class="account-meta">${ACCOUNT_KIND_LABELS[account.kind]} ending ${account.mask}</span>
      </div>
      <div class="account-balance">
        <span class="amount">${formatCents(account.balanceCents)}</span>
        <span class="account-meta">${account.balanceLabel}</span>
      </div>
    </li>`;
}

function activityRow(txn: GeneratedTransaction, accountName: string): SafeHtml {
  return html`
    <tr>
      <td class="date">${formatShortDate(txn.postedOn)}</td>
      <td>
        <span class="txn-description">${txn.merchantName ?? txn.description}</span>
        <span class="account-meta">${accountName}</span>
      </td>
      <td class="amount ${txn.amountCents > 0 ? 'credit' : ''}">${signedAmount(txn.amountCents)}</td>
    </tr>`;
}

export function accountsPage(bank: DemoBank, customer: BankCustomer): string {
  const names = new Map(customer.accounts.map((account) => [account.key, account.name]));
  const recent = customer.transactions.slice(-25).reverse();
  return page({
    title: `Accounts | ${bank.name}`,
    bank,
    body: bankChrome(
      bank,
      customer,
      'accounts',
      html`
        <h1>Welcome back, ${customer.firstName}</h1>
        <div class="accounts-layout">
          <section aria-labelledby="accounts-heading">
            <h2 id="accounts-heading">Your accounts</h2>
            <ul class="accounts">
              ${customer.accounts.map(accountRow)}
            </ul>
          </section>
          <aside class="promo">
            <h2>Tax savings</h2>
            <p>See what your accounts could save you at tax time, found from activity we already have.</p>
            <a class="button" href="/${bank.slug}/tax">Open tax savings</a>
          </aside>
        </div>
        <section aria-labelledby="activity-heading">
          <h2 id="activity-heading">Recent activity</h2>
          <table class="activity">
            <thead>
              <tr><th scope="col">Date</th><th scope="col">Description</th><th scope="col" class="amount">Amount</th></tr>
            </thead>
            <tbody>
              ${recent.map((txn) => activityRow(txn, names.get(txn.accountKey) ?? txn.accountKey))}
            </tbody>
          </table>
        </section>`,
    ),
  });
}

export function taxPage(
  bank: DemoBank,
  customer: BankCustomer,
  widget: { ok: true; src: string; origin: string } | { ok: false; reason: string; hint: string },
): string {
  const content = widget.ok
    ? html`
        <iframe
          class="salsa-frame"
          src="${widget.src}"
          title="Tax savings by salsa"
          sandbox="allow-scripts allow-same-origin"
          referrerpolicy="no-referrer"
          data-origin="${widget.origin}"
        ></iframe>
        <script>
          // Listen to the salsa widget, and only to it.
          const frame = document.querySelector('.salsa-frame');
          window.addEventListener('message', (event) => {
            if (event.origin !== frame.dataset.origin || event.source !== frame.contentWindow) return;
            const data = event.data;
            if (!data || typeof data !== 'object' || Array.isArray(data)) return;
            if (data.type === 'salsa:resize') {
              // Never interpolate an unvalidated message into CSS.
              // Keep a bounded height to prevent layout abuse from a compromised iframe.
              if (typeof data.height !== 'number' || !Number.isFinite(data.height)) return;
              if (!Number.isInteger(data.height) || data.height < 100 || data.height > 10000) return;
              frame.style.height = data.height + 'px';
            } else if (data.type === 'salsa:reload') {
              window.location.reload();
            }
          });
        </script>`
    : html`
        <div class="unavailable" role="alert">
          <h2>Tax savings isn't available right now</h2>
          <p>Your accounts aren't affected. Try again in a few minutes.</p>
          <details>
            <summary>Details for developers</summary>
            <p>${widget.reason}</p>
            <p>${widget.hint}</p>
          </details>
        </div>`;

  return page({
    title: `Tax savings | ${bank.name}`,
    bank,
    body: bankChrome(
      bank,
      customer,
      'tax',
      html`
        <h1>Tax savings</h1>
        <p class="partner-note">
          Provided by salsa, our tax savings partner. Salsa reads your account activity to find
          possible savings. It never sees your password.
        </p>
        ${content}`,
    ),
  });
}

export function notFoundPage(): string {
  return page({
    title: 'Not found',
    bodyClass: 'sandbox',
    body: html`<main class="sandbox-main">
      <h1>That page doesn't exist</h1>
      <p><a href="/">Back to the bank list</a></p>
    </main>`,
  });
}
