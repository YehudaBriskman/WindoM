import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changelogSection } from './changelog-section.mjs';

const SAMPLE = `# Changelog

Intro.

---

## [1.7.0] - 2026-11-04

Server release.

### Added
- OTel.

## [1.6.0] - 2026-11-04

### Added
- Sessions.

---

## [1.0.0] - 2026-03-19

First.
`;

test('returns one version, without its heading or the next one', () => {
  assert.equal(changelogSection(SAMPLE, '1.7.0'), 'Server release.\n\n### Added\n- OTel.');
  assert.equal(changelogSection(SAMPLE, 'v1.6.0'), '### Added\n- Sessions.');
});

test('the last section runs to the end of the file', () => {
  assert.equal(changelogSection(SAMPLE, '1.0.0'), 'First.');
});

test('a missing version, or a prefix of one, is null', () => {
  assert.equal(changelogSection(SAMPLE, '1.5.0'), null);
  assert.equal(changelogSection(SAMPLE, '1.7'), null);
});

test('every tagged version has notes in the real CHANGELOG', () => {
  const text = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');
  for (const v of ['1.7.0', '1.6.0', '1.5.1', '1.5.0', '1.0.0']) {
    assert.ok(changelogSection(text, v), `CHANGELOG.md has no notes for ${v}`);
  }
});
