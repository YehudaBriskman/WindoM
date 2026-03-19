import { describe, it, expect, afterAll } from 'vitest';
import { buildTestApp } from '../../test-utils/app.js';

const app = await buildTestApp();
afterAll(() => app.close());

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; ts: string }>();
    expect(body.status).toBe('ok');
    expect(typeof body.ts).toBe('string');
  });
});
