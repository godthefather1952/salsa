import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Widget tokens are short-lived passes that let the salsa widget, running in a
 * customer's browser, read that one customer's data and nothing else.
 *
 * The bank's server requests one (proving who it is with its API key), and the
 * bank's page hands it to the widget. Format: `wt1.<payload>.<signature>`, where
 * the signature is an HMAC of the payload with SESSION_SECRET. Anyone can read
 * the payload, but nobody without the secret can change it or make a new one.
 */

const VERSION = 'wt1';

export interface WidgetTokenClaims {
  tenantId: string;
  customerId: string;
  /** Unix time in seconds. */
  expiresAt: number;
}

function sign(data: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(data).digest();
}

export function signWidgetToken(claims: WidgetTokenClaims, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ t: claims.tenantId, c: claims.customerId, exp: claims.expiresAt }),
  ).toString('base64url');
  const signed = `${VERSION}.${payload}`;
  return `${signed}.${sign(signed, secret).toString('base64url')}`;
}

/** Returns the claims if the token is genuine and unexpired, otherwise null. */
export function verifyWidgetToken(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): WidgetTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  const [version, payload, signature] = parts as [string, string, string];

  const expected = sign(`${version}.${payload}`, secret);
  const actual = Buffer.from(signature, 'base64url');
  // Constant-time comparison, so response timing reveals nothing about the signature.
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof decoded !== 'object' || decoded === null) return null;
  const { t, c, exp } = decoded as Record<string, unknown>;
  if (typeof t !== 'string' || typeof c !== 'string' || typeof exp !== 'number') return null;
  if (exp * 1000 <= nowMs) return null;

  return { tenantId: t, customerId: c, expiresAt: exp };
}
