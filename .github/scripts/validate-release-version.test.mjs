import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateReleaseVersion, versionFromTag, versionSources } from './validate-release-version.mjs';

const agreeing = {
  tag: 'v1.5.0', backendVersion: '1.5.0', webVersion: '1.5.0', manifestVersion: '1.5.0',
};

test('accepts a tag that agrees with every declared version', () => {
  assert.deepEqual(validateReleaseVersion(agreeing), []);
});

test('accepts a fully qualified ref', () => {
  assert.deepEqual(validateReleaseVersion({ ...agreeing, tag: 'refs/tags/v1.5.0' }), []);
});

test('accepts a tag without the conventional v prefix', () => {
  assert.deepEqual(validateReleaseVersion({ ...agreeing, tag: '1.5.0' }), []);
});

test('strips refs/tags/ and the v prefix', () => {
  assert.equal(versionFromTag('refs/tags/v2.0.1'), '2.0.1');
  assert.equal(versionFromTag('v2.0.1'), '2.0.1');
  assert.equal(versionFromTag('2.0.1'), '2.0.1');
  assert.equal(versionFromTag(undefined), '');
});

test('requires a tag', () => {
  assert.deepEqual(validateReleaseVersion({ ...agreeing, tag: '' }), [
    'Missing release tag: expected something like v1.5.0',
  ]);
});

// Each source is named individually so the failure says which file to edit.
for (const { label, key } of versionSources) {
  test(`reports a mismatch in ${label}`, () => {
    const errors = validateReleaseVersion({ ...agreeing, [key]: '1.4.0' });
    assert.deepEqual(errors, [`Version mismatch: tag is 1.5.0 but ${label} declares 1.4.0`]);
  });

  test(`reports a missing version in ${label}`, () => {
    const errors = validateReleaseVersion({ ...agreeing, [key]: undefined });
    assert.deepEqual(errors, [`Missing version in ${label}`]);
  });
}

test('reports every disagreeing source together rather than stopping at the first', () => {
  const errors = validateReleaseVersion({
    tag: 'v1.5.0', backendVersion: '1.4.0', webVersion: '1.4.1', manifestVersion: '0.9.0',
  });
  assert.equal(errors.length, versionSources.length);
});

// The Chrome Web Store rejects pre-release suffixes, so catching them at the gate
// avoids deploying the backend and then failing the publish half-way through.
for (const tag of ['v1.5.0-rc.1', 'v1.5.0+build7', 'vbeta', 'v1.2.3.4.5']) {
  test(`rejects a tag the Chrome Web Store cannot accept: ${tag}`, () => {
    const version = versionFromTag(tag);
    const errors = validateReleaseVersion({
      tag, backendVersion: version, webVersion: version, manifestVersion: version,
    });
    assert.ok(
      errors.some((e) => e.includes('not publishable')),
      `expected a publishability error for ${tag}, got ${JSON.stringify(errors)}`,
    );
  });
}

test('accepts the one-to-four part versions Chrome allows', () => {
  for (const version of ['1', '1.2', '1.2.3', '1.2.3.4']) {
    const errors = validateReleaseVersion({
      tag: `v${version}`, backendVersion: version, webVersion: version, manifestVersion: version,
    });
    assert.deepEqual(errors, [], `expected ${version} to be accepted`);
  }
});

test('tolerates surrounding whitespace in declared versions', () => {
  assert.deepEqual(validateReleaseVersion({ ...agreeing, webVersion: ' 1.5.0 ' }), []);
});
