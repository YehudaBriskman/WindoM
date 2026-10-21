import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { requiredVariables, validatePublishEnv } from './validate-publish-env.mjs';

const validEnv = {
  CHROME_EXTENSION_ID: 'a'.repeat(32), CHROME_PUBLISHER_ID: 'fake-publisher-id',
  CHROME_CLIENT_ID: 'fake-client-id',
  CHROME_CLIENT_SECRET: 'DO-NOT-LOG-client-secret', CHROME_REFRESH_TOKEN: 'DO-NOT-LOG-refresh-token',
  VITE_BACKEND_URL: 'https://api.windom.app',
};

test('accepts a complete publish configuration', () => {
  assert.deepEqual(validatePublishEnv(validEnv), []);
});

for (const name of requiredVariables) {
  for (const value of [undefined, '', ' \t\n']) {
    test(`rejects missing or blank ${name}: ${JSON.stringify(value)}`, () => {
      assert.deepEqual(validatePublishEnv({ ...validEnv, [name]: value }), [`Missing required secret: ${name}`]);
    });
  }
}

test('reports every missing variable together', () => {
  assert.equal(validatePublishEnv({}).length, requiredVariables.length);
});

for (const url of ['not-a-url', 'http://localhost:8080', 'javascript:alert(1)', 'https://user:DO-NOT-LOG@example.com']) {
  test(`rejects unsupported backend URL (${url.split(':')[0]}) without revealing it`, () => {
    assert.deepEqual(validatePublishEnv({ ...validEnv, VITE_BACKEND_URL: url }),
      ['VITE_BACKEND_URL must be an HTTPS URL without embedded credentials']);
  });
}

test('CLI fails without credentials and logs only names', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./validate-publish-env.mjs', import.meta.url))], {
    env: { ...process.env, ...validEnv, CHROME_EXTENSION_ID: '', VITE_BACKEND_URL: 'https://user:DO-NOT-LOG@example.com' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /CHROME_EXTENSION_ID/);
  assert.match(result.stderr, /VITE_BACKEND_URL/);
  assert.doesNotMatch(result.stderr + result.stdout, /DO-NOT-LOG|fake-client-id/);
});

test('CLI succeeds silently with valid credentials', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./validate-publish-env.mjs', import.meta.url))], {
    env: { ...process.env, ...validEnv }, encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout + result.stderr, '');
});
