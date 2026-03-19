import { describe, it, expect, beforeAll } from 'vitest';

// Must set the env var before any module that imports config is loaded
beforeAll(() => {
  // 32 random bytes encoded as base64 for TOKEN_ENC_KEY_BASE64
  process.env['TOKEN_ENC_KEY_BASE64'] = Buffer.from(new Uint8Array(32).fill(1)).toString('base64');
});

// Dynamic import so the env var is set first
const { encryptToken, decryptToken } = await import('../crypto.js');

describe('encryptToken', () => {
  it('returns a non-empty string in iv:ciphertext format', async () => {
    const encrypted = await encryptToken('hello world');
    expect(encrypted).toContain(':');
    expect(encrypted.length).toBeGreaterThan(10);
  });

  it('produces different ciphertexts for the same input (random IV)', async () => {
    const enc1 = await encryptToken('same plaintext');
    const enc2 = await encryptToken('same plaintext');
    expect(enc1).not.toBe(enc2);
  });
});

describe('decryptToken', () => {
  it('round-trips plaintext through encrypt + decrypt', async () => {
    const plaintext = 'super-secret-oauth-token';
    const encrypted = await encryptToken(plaintext);
    const decrypted = await decryptToken(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('throws on malformed ciphertext (missing colon)', async () => {
    await expect(decryptToken('notvalidbase64nocol')).rejects.toThrow();
  });
});
