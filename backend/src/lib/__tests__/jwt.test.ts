import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env['JWT_ACCESS_SECRET'] = 'a-test-secret-that-is-long-enough-32chars';
});

const { signAccessToken, verifyAccessToken } = await import('../jwt.js');

describe('signAccessToken', () => {
  it('returns a non-empty JWT string', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: 'a@b.com', name: 'Alice' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // header.payload.signature
  });
});

describe('verifyAccessToken', () => {
  it('round-trips the payload correctly', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: 'a@b.com', name: 'Alice' });
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
    expect(payload.name).toBe('Alice');
  });

  it('throws on a tampered token', async () => {
    const token = await signAccessToken({ sub: 'user-1', email: null, name: 'Bob' });
    const parts = token.split('.');
    // Corrupt the signature
    const bad = `${parts[0]}.${parts[1]}.invalidsignature`;
    await expect(verifyAccessToken(bad)).rejects.toThrow();
  });

  it('throws on a completely invalid string', async () => {
    await expect(verifyAccessToken('not.a.jwt')).rejects.toThrow();
  });
});
