import assert from 'node:assert/strict';
import { test } from 'node:test';
import { patternCoversUrl, validateBackendOrigin } from './validate-backend-origin.mjs';

const manifestPermissions = [
  'https://api.unsplash.com/*',
  'https://api.windom.app/*',
  'https://query1.finance.yahoo.com/*',
];

test('accepts a backend origin that host_permissions covers', () => {
  assert.deepEqual(validateBackendOrigin('https://api.windom.app', manifestPermissions), []);
});

test('accepts a backend URL carrying a path', () => {
  assert.deepEqual(validateBackendOrigin('https://api.windom.app/v1', manifestPermissions), []);
});

// The #302 failure mode: the backend answers on a host the manifest never permitted,
// so every authenticated request is blocked in the user's browser while CI stays green.
test('rejects a backend origin absent from host_permissions', () => {
  const errors = validateBackendOrigin('https://windom-api.fly.dev', manifestPermissions);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not cover the backend origin https:\/\/windom-api\.fly\.dev/);
  assert.match(errors[0], /Add "https:\/\/windom-api\.fly\.dev\/\*"/);
});

test('rejects a non-https backend', () => {
  const errors = validateBackendOrigin('http://api.windom.app', manifestPermissions);
  assert.ok(errors.some((e) => e.includes('must use https')));
});

test('rejects a malformed URL', () => {
  assert.deepEqual(validateBackendOrigin('not-a-url', manifestPermissions), [
    'VITE_BACKEND_URL is not a valid URL',
  ]);
});

test('rejects a manifest with no host_permissions', () => {
  assert.deepEqual(validateBackendOrigin('https://api.windom.app', undefined), [
    'web/manifest.json has no host_permissions array',
  ]);
});

test('rejects an empty host_permissions list', () => {
  const errors = validateBackendOrigin('https://api.windom.app', []);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not cover/);
});

test('does not treat a different subdomain as covered', () => {
  const errors = validateBackendOrigin('https://staging.windom.app', manifestPermissions);
  assert.match(errors[0], /does not cover/);
});

describe_patterns();

function describe_patterns() {
  const url = new URL('https://api.windom.app/health');

  test('exact host pattern matches', () => {
    assert.equal(patternCoversUrl('https://api.windom.app/*', url), true);
  });

  test('wildcard subdomain pattern matches the subdomain and the apex', () => {
    assert.equal(patternCoversUrl('https://*.windom.app/*', url), true);
    assert.equal(patternCoversUrl('https://*.windom.app/*', new URL('https://windom.app/')), true);
  });

  test('wildcard scheme matches https', () => {
    assert.equal(patternCoversUrl('*://api.windom.app/*', url), true);
  });

  test('all_urls matches anything', () => {
    assert.equal(patternCoversUrl('<all_urls>', url), true);
  });

  test('http-only pattern does not cover an https origin', () => {
    assert.equal(patternCoversUrl('http://api.windom.app/*', url), false);
  });

  test('a different host does not match', () => {
    assert.equal(patternCoversUrl('https://api.example.com/*', url), false);
  });

  test('a sibling subdomain does not match via suffix confusion', () => {
    assert.equal(patternCoversUrl('https://*.notwindom.app/*', url), false);
    assert.equal(patternCoversUrl('https://evil-windom.app/*', url), false);
  });

  test('malformed and non-string patterns are not treated as matches', () => {
    for (const pattern of ['', 'nonsense', 'ftp://api.windom.app/*', undefined, null, 42]) {
      assert.equal(patternCoversUrl(pattern, url), false, `expected ${String(pattern)} to not match`);
    }
  });

  test('host matching is case insensitive', () => {
    assert.equal(patternCoversUrl('https://API.Windom.App/*', url), true);
  });
}
