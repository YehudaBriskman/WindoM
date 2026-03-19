import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password.js';

describe('hashPassword', () => {
  it('produces a bcrypt hash that is not the original password', async () => {
    const hash = await hashPassword('mysecret123');
    expect(hash).not.toBe('mysecret123');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('produces different hashes for the same input (random salt)', async () => {
    const hash1 = await hashPassword('samepassword');
    const hash2 = await hashPassword('samepassword');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('returns true for matching password and hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});
