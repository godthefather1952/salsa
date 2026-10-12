/**
 * How a bank's server talks to salsa. This code would live in the bank's
 * backend, because it uses the bank's secret API key. The key must never be
 * sent to a browser.
 */
import type { ApiErrorResponse, WidgetSessionResponse } from '@salsa/core';

export type WidgetSessionResult =
  | ({ ok: true } & WidgetSessionResponse)
  | { ok: false; reason: string; hint: string };

export async function createWidgetSession(
  apiUrl: string,
  apiKey: string,
  customerRef: string,
): Promise<WidgetSessionResult> {
  let response: Response;
  try {
    response = await fetch(new URL('/v1/widget-sessions', apiUrl), {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ customerRef }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    return {
      ok: false,
      reason: `Could not reach the salsa API at ${apiUrl} (${(error as Error).message}).`,
      hint: 'Start everything with `pnpm dev` from the repo root.',
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    const code = body?.error.code ?? 'unknown_error';
    return {
      ok: false,
      reason: `Salsa answered ${response.status} (${code}): ${body?.error.message ?? 'no details'}`,
      hint:
        code === 'invalid_api_key' || code === 'customer_not_found'
          ? "Salsa's database doesn't have the demo banks yet. Run `pnpm db:setup`, then reload."
          : 'Check the API logs in the terminal running `pnpm dev`.',
    };
  }

  return { ok: true, ...((await response.json()) as WidgetSessionResponse) };
}

export async function salsaIsHealthy(apiUrl: string): Promise<boolean> {
  try {
    const response = await fetch(new URL('/health', apiUrl), {
      signal: AbortSignal.timeout(1_500),
    });
    return response.ok;
  } catch {
    return false;
  }
}
