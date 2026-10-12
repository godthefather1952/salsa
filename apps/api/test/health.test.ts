import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { memoryDatabase } from './helpers';

describe('GET /health', () => {
  it('reports ok when the database answers', async () => {
    const handle = await memoryDatabase();
    const app = buildApp({ db: handle.db, logLevel: 'silent' });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'ok' });
    await app.close();
    await handle.close();
  });

  it('returns 503 when the database is unreachable', async () => {
    const handle = await memoryDatabase();
    await handle.close();
    const app = buildApp({ db: handle.db, logLevel: 'silent' });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ database: 'unreachable' });
    await app.close();
  });
});
