import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { originOf, packageErrors, sha256File } from './release-package.mjs';

const SHA = 'c'.repeat(40);
const SUM = 'd'.repeat(64);
const info = {
  tag: 'v1.6.0', sha: SHA, sha256: SUM, manifestVersion: '1.6.0', backendOrigin: 'https://windom-api.fly.dev',
};
const expected = { tag: 'v1.6.0', sha: SHA, backendUrl: 'https://windom-api.fly.dev' };

test('the file the gate checked, for this release, is published', () => {
  assert.deepEqual(packageErrors(info, SUM, expected), []);
});

test('a trailing slash or a refs/tags/ prefix does not count as a difference', () => {
  assert.deepEqual(packageErrors(info, SUM, { ...expected, tag: 'refs/tags/v1.6.0', backendUrl: 'https://windom-api.fly.dev/' }), []);
});

// The defect W2 removes: the store received a rebuild, not the checked file.
test('a ZIP whose bytes differ from what the gate recorded is refused', () => {
  const e = packageErrors(info, 'e'.repeat(64), expected);
  assert.equal(e.length, 1);
  assert.match(e[0], /not the file the gate checked/);
});

test('a ZIP built from another commit is refused', () => {
  assert.match(packageErrors({ ...info, sha: 'f'.repeat(40) }, SUM, expected)[0], /built from/);
});

test('a ZIP built for another tag is refused', () => {
  const e = packageErrors({ ...info, tag: 'v1.5.1', manifestVersion: '1.5.1' }, SUM, expected);
  assert.equal(e.length, 2);
});

test('a ZIP whose manifest disagrees with the tag is refused', () => {
  assert.match(packageErrors({ ...info, manifestVersion: '1.5.9' }, SUM, expected)[0], /manifest declares 1.5.9/);
});

// The gate falls back to the production URL when the secret is absent, so the
// publish must prove the ZIP talks to the backend it is being published for.
test('a ZIP built against another backend is refused', () => {
  const e = packageErrors({ ...info, backendOrigin: 'https://staging.example.com' }, SUM, expected);
  assert.match(e[0], /talks to https:\/\/staging.example.com/);
});

test('a missing or non-HTTPS backend URL is refused', () => {
  assert.match(packageErrors(info, SUM, { ...expected, backendUrl: '' })[0], /VITE_BACKEND_URL/);
  assert.match(packageErrors(info, SUM, { ...expected, backendUrl: 'http://windom-api.fly.dev' })[0], /VITE_BACKEND_URL/);
});

test('missing records fail closed', () => {
  assert.equal(packageErrors(null, SUM, expected).length, 1);
  assert.match(packageErrors({ ...info, sha256: undefined }, SUM, expected)[0], /no sha256/);
  assert.match(packageErrors(info, SUM, { ...expected, sha: '' })[0], /No commit/);
  assert.match(packageErrors(info, SUM, { ...expected, tag: '' })[0], /No release tag/);
});

test('origins drop paths and refuse credentials and plain http', () => {
  assert.equal(originOf('https://a.example/x/'), 'https://a.example');
  assert.equal(originOf('https://u:p@a.example'), null);
  assert.equal(originOf('http://a.example'), null);
  assert.equal(originOf('not a url'), null);
});

// The value the gate records comes from `sha256sum`; the two must agree.
test('sha256File agrees with sha256sum on a known input', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pkg-'));
  try {
    const f = join(dir, 'x.zip');
    writeFileSync(f, 'abc');
    assert.equal(sha256File(f), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
