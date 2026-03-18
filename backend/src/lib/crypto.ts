import { config } from '../config.js';

// AES-GCM encryption for storing OAuth access/refresh tokens at rest.
// Key is loaded once from the TOKEN_ENC_KEY_BASE64 env var.

let _key: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_key) return _key;
  const raw = Buffer.from(config.TOKEN_ENC_KEY_BASE64, 'base64');
  if (raw.length !== 32) throw new Error('TOKEN_ENC_KEY_BASE64 must encode exactly 32 bytes');
  _key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  return _key;
}

/** Encrypt plaintext → base64-encoded `iv:ciphertext` string */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const ivB64 = Buffer.from(iv).toString('base64');
  const ctB64 = Buffer.from(cipherBuf).toString('base64');
  return `${ivB64}:${ctB64}`;
}

/** Decrypt `iv:ciphertext` base64 string → original plaintext */
export async function decryptToken(encrypted: string): Promise<string> {
  const key = await getKey();
  const [ivB64, ctB64] = encrypted.split(':');
  if (!ivB64 || !ctB64) throw new Error('Invalid encrypted token format');
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(plainBuf);
}
