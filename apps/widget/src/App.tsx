import { formatCents, type WidgetMeResponse } from '@salsa/core';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { fetchMe, WidgetApiError } from './api';
import { findingsFrom, STILL_CHECKING } from './findings';
import { askHostToReload, sessionToken } from './session';

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: WidgetMeResponse }
  | { status: 'no-session' }
  | { status: 'expired' }
  | { status: 'unavailable' };

const longDate = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatIsoDate(iso: string): string {
  return longDate.format(new Date(`${iso}T00:00:00Z`));
}

export function App() {
  const [state, setState] = useState<State>(() =>
    sessionToken ? { status: 'loading' } : { status: 'no-session' },
  );

  useEffect(() => {
    if (!sessionToken) return;
    const controller = new AbortController();
    fetchMe(sessionToken, controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const expired = error instanceof WidgetApiError && error.status === 401;
        setState({ status: expired ? 'expired' : 'unavailable' });
      });
    return () => controller.abort();
  }, []);

  if (state.status === 'ready') return <Savings data={state.data} />;

  return (
    <main className="widget">
      <div className="brand-strip" />
      {state.status === 'loading' && <p className="status">Checking your accounts…</p>}
      {state.status === 'no-session' && (
        <Notice title="Open this from your online banking">
          This panel works inside your bank's website. Sign in there and choose Tax savings.
        </Notice>
      )}
      {state.status === 'expired' && (
        <Notice title="This view has timed out">
          For your security, tax savings closes after 15 minutes.{' '}
          <button type="button" className="link-button" onClick={askHostToReload}>
            Reload tax savings
          </button>
        </Notice>
      )}
      {state.status === 'unavailable' && (
        <Notice title="Tax savings isn't available right now">
          Your accounts aren't affected. Try again in a few minutes.
        </Notice>
      )}
    </main>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="notice">
      <h1>{title}</h1>
      <p>{children}</p>
    </section>
  );
}

function Savings({ data }: { data: WidgetMeResponse }) {
  const findings = findingsFrom(data);
  const theme = {
    '--brand': data.bank.branding.primaryColor,
    '--brand-accent': data.bank.branding.accentColor,
  } as CSSProperties;

  return (
    <main className="widget" style={theme}>
      <div className="brand-strip" />

      <header className="masthead">
        <p className="kicker">Tax savings for {data.taxYear}</p>
        <p className="preview-tag" title="Early version: only some savings are checked so far">
          Preview
        </p>
      </header>

      {findings.length > 0 ? (
        <h1>{data.customer.firstName}, here's what we've found in your accounts so far.</h1>
      ) : (
        <>
          <h1>
            {data.customer.firstName}, nothing to report yet for {data.taxYear}.
          </h1>
          <p className="lede">
            We check loan interest first. The other ways to save are listed below.
          </p>
        </>
      )}

      {findings.length > 0 && (
        <section aria-labelledby="found-heading">
          <h2 id="found-heading">Found in your accounts</h2>
          <ul className="findings">
            {findings.map((finding) => (
              <li key={finding.id} className="finding">
                <div className="finding-text">
                  <h3>{finding.title}</h3>
                  <p className="finding-account">{finding.account}</p>
                  <p>{finding.explanation}</p>
                </div>
                <div className="field">
                  <span className="field-label">Paid in {data.taxYear}</span>
                  <span className="field-value">{formatCents(finding.amountCents)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="checking-heading">
        <h2 id="checking-heading">Still to check</h2>
        <ul className="checklist">
          {STILL_CHECKING.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <span className="pending">Not checked yet</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footnote">
        <p>
          {data.dataThrough
            ? `Based on ${data.transactionCount.toLocaleString('en-US')} transactions through ${formatIsoDate(data.dataThrough)}.`
            : `No ${data.taxYear} transactions yet.`}{' '}
          {data.disclaimer}
        </p>
        <p className="powered">Tax savings by salsa, a partner of {data.bank.name}</p>
      </footer>
    </main>
  );
}
