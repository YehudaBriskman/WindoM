import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decideReleaseRef } from './resolve-release-ref.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

const tagPush = { tag: 'v1.5.1', tagSha: A, tagOnMain: true, refType: 'tag', eventSha: A, requireTag: true };
// A manual publish of an existing tag, dispatched from main whose tip is B.
const manualPublish = { ...tagPush, refType: 'branch', eventSha: B };
const dryRun = { tag: 'v1.6.0', tagSha: null, tagOnMain: false, refType: 'branch', eventSha: B, requireTag: false };

test('a tag push on main releases the tagged commit', () => {
  assert.deepEqual(decideReleaseRef(tagPush), { sha: A, dryRun: false, errors: [] });
});

test('accepts refs/tags/ and a missing v prefix', () => {
  assert.equal(decideReleaseRef({ ...tagPush, tag: 'refs/tags/v1.5.1' }).sha, A);
  assert.equal(decideReleaseRef({ ...tagPush, tag: '1.5.1' }).sha, A);
});

// The defect this script exists for: the gate checked the dispatch branch (B)
// while publish uploaded the tag (A). The answer must be the TAG's commit.
test('a manual publish checks the tag, not the branch it was dispatched from', () => {
  const r = decideReleaseRef(manualPublish);
  assert.deepEqual(r.errors, []);
  assert.equal(r.sha, A);
  assert.notEqual(r.sha, manualPublish.eventSha);
});

// Previously skipped for every manual run.
test('a manual publish of a tag that is not on main is refused', () => {
  const r = decideReleaseRef({ ...manualPublish, tagOnMain: false });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /is not on main/);
});

test('a tag push that is not on main is refused', () => {
  assert.match(decideReleaseRef({ ...tagPush, tagOnMain: false }).errors[0], /is not on main/);
});

test('a manual publish of a tag that does not exist is refused', () => {
  const r = decideReleaseRef({ ...manualPublish, tagSha: null });
  assert.equal(r.sha, null);
  assert.match(r.errors[0], /does not exist/);
});

test('a tag moved after the push is refused', () => {
  const r = decideReleaseRef({ ...tagPush, eventSha: B });
  assert.match(r.errors[0], /Was the tag moved/);
});

test('a dry run of an untagged version rehearses the dispatch ref, from any branch', () => {
  assert.deepEqual(decideReleaseRef(dryRun), { sha: B, dryRun: true, errors: [] });
});

test('a dry run of an existing tag rehearses the tag, and does not require main', () => {
  const r = decideReleaseRef({ ...dryRun, tag: 'v1.5.1', tagSha: A, tagOnMain: false });
  assert.deepEqual(r, { sha: A, dryRun: true, errors: [] });
});

test('requires a tag', () => {
  assert.match(decideReleaseRef({ ...tagPush, tag: '' }).errors[0], /Missing release tag/);
  assert.match(decideReleaseRef({ ...tagPush, tag: undefined }).errors[0], /Missing release tag/);
});

// The value reaches a shell and git's revision parser; only a version is a release.
for (const bad of ['main', 'v1.5.1; rm -rf /', 'v1.5.1^{tree}', '--upload-pack=x', 'v1.5.0-rc.1', 'HEAD']) {
  test(`refuses a tag that is not version-shaped: ${JSON.stringify(bad)}`, () => {
    const r = decideReleaseRef({ ...tagPush, tag: bad });
    assert.equal(r.sha, null);
    assert.match(r.errors[0], /is not a release tag/);
  });
}

test('refuses a resolved value that is not a commit id', () => {
  assert.match(decideReleaseRef({ ...tagPush, tagSha: 'deadbeef' }).errors[0], /not a commit id/);
});

test('a dry run with no usable event sha has nothing to rehearse', () => {
  assert.equal(decideReleaseRef({ ...dryRun, eventSha: '' }).errors.length, 1);
});
