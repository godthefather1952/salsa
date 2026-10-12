import { describe, expect, it } from 'vitest';
import { signWidgetToken, verifyWidgetToken } from '../src/auth/widget-token';

const SECRET = 'test-secret-that-is-at-least-32-characters';
const NOW = Date.UTC(2026, 9, 12, 12, 0, 0);
const claims = {
  tenantId: '00000000-0000-4000-8000-000000000001',
  customerId: '00000000-0000-4000-8000-000000000002',
  expiresAt: NOW / 1000 + 900,
};

describe('widget tokens', () => {
  it('round-trips claims', () => {
    const token = signWidgetToken(claims, SECRET);
    expect(token.startsWith('wt1.')).toBe(true);
    expect(verifyWidgetToken(token, SECRET, NOW)).toEqual(claims);
  });

  it('rejects a token signed with another secret', () => {
    const token = signWidgetToken(claims, 'some-other-secret-that-is-32-characters-long');
    expect(verifyWidgetToken(token, SECRET, NOW)).toBeNull();
  });

  it('rejects a token whose payload was edited to another customer', () => {
    const [version, , signature] = signWidgetToken(claims, SECRET).split('.');
    const forged = Buffer.from(
      JSON.stringify({ t: claims.tenantId, c: 'someone-else', exp: claims.expiresAt }),
    ).toString('base64url');
    expect(verifyWidgetToken(`${version}.${forged}.${signature}`, SECRET, NOW)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = signWidgetToken(claims, SECRET);
    expect(verifyWidgetToken(token, SECRET, claims.expiresAt * 1000)).toBeNull();
  });

  it('rejects garbage', () => {
    for (const junk of ['', 'abc', 'wt1..', 'wt1.e30.', 'wt2.a.b', 'Bearer x']) {
      expect(verifyWidgetToken(junk, SECRET, NOW)).toBeNull();
    }
  });
});
