import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Starting PGlite and seeding a year of data takes a few seconds.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
