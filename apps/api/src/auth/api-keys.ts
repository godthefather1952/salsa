import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '../db/client';
import { tenantApiKeys, tenants } from '../db/schema';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** A new random key. Show it to the bank once; store only `hashApiKey(key)`. */
export function generateApiKey(mode: 'test' | 'live'): string {
  return `sk_${mode}_${randomBytes(24).toString('base64url')}`;
}

export function apiKeyPrefix(key: string): string {
  return `${key.slice(0, 12)}…`;
}

/** Reads `Authorization: Bearer <token>`. */
export function bearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

export interface AuthenticatedTenant {
  id: string;
  slug: string;
  name: string;
}

/** Returns the bank that owns this key, or null if the key is unknown or revoked. */
export async function findTenantByApiKey(
  db: Database,
  key: string,
): Promise<AuthenticatedTenant | null> {
  const [row] = await db
    .select({ id: tenants.id, slug: tenants.slug, name: tenants.name })
    .from(tenantApiKeys)
    .innerJoin(tenants, eq(tenantApiKeys.tenantId, tenants.id))
    .where(and(eq(tenantApiKeys.keyHash, hashApiKey(key)), isNull(tenantApiKeys.revokedAt)))
    .limit(1);
  return row ?? null;
}
