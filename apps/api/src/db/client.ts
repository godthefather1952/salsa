import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface DatabaseHandle {
  db: Database;
  driver: 'pglite' | 'pg';
  /** Applies any migrations in apps/api/drizzle that have not run yet. */
  migrate: () => Promise<void>;
  close: () => Promise<void>;
}

// Resolved from this source file. Migrations run from source (pnpm db:migrate,
// tests), never from the bundled server in dist/.
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * Opens a database from a URL. Drivers are imported lazily so production
 * (Postgres over the network) never loads PGlite's WebAssembly build.
 */
export async function openDatabase(url: string): Promise<DatabaseHandle> {
  if (url.startsWith('pglite://')) {
    const location = url.slice('pglite://'.length);
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    const inMemory = location === 'memory' || location === '';
    if (!inMemory) await mkdir(location, { recursive: true });
    const client = inMemory ? new PGlite() : new PGlite(location);
    const db = drizzle({ client, schema });
    return {
      db,
      driver: 'pglite',
      migrate: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
      close: () => client.close(),
    };
  }

  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const pool = new Pool({ connectionString: url, max: 10 });
    const db = drizzle({ client: pool, schema });
    return {
      db,
      driver: 'pg',
      migrate: () => migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }),
      close: () => pool.end(),
    };
  }

  throw new Error('DATABASE_URL must start with pglite:// or postgres://');
}
