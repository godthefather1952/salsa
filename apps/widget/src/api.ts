import type { ApiErrorResponse, WidgetMeResponse } from '@salsa/core';

export class WidgetApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function fetchMe(token: string, signal?: AbortSignal): Promise<WidgetMeResponse> {
  const response = await fetch('/v1/widget/me', {
    headers: { authorization: `Bearer ${token}` },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new WidgetApiError(
      response.status,
      body?.error.code ?? 'http_error',
      body?.error.message ?? `Request failed with status ${response.status}`,
    );
  }
  return (await response.json()) as WidgetMeResponse;
}
