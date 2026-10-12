import { defineConfig } from 'drizzle-kit';

// Only `drizzle-kit generate` is used: it diffs src/db/schema.ts against the
// committed migrations and writes a new SQL file. Migrations are applied by
// `pnpm db:migrate`, which works for both PGlite and real Postgres.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
