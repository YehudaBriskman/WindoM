import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  expectedVersionFrom,
  fetchPublishedStatus,
  interpretItem,
  interpretPublish,
  interpretStatus,
  publishItem,
  revisionVersion,
  statusUrl,
} from './report-store-status.mjs';

test('a rejected upload is an error, and says why', () => {
  const { errors } = interpretItem({
    uploadState: 'FAILURE',
    itemError: [{ error_detail: 'Manifest is missing a required field' }],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /missing a required field/);
});

test('an accepted upload is not an error, because review is still pending', () => {
  const { errors, notes } = interpretItem({ uploadState: 'SUCCESS' });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /review clears/);
});

test('an upload still processing is reported but does not fail the release', () => {
  const { errors, notes } = interpretItem({ uploadState: 'IN_PROGRESS' });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /still processing/);
});

test('a draft holding the wrong version is an error - the upload did not land', () => {
  const { errors } = interpretItem(
    { uploadState: 'SUCCESS', crxVersion: '1.4.1' },
    { expectedVersion: '1.5.0' },
  );
  assert.equal(errors.length, 1);
  assert.match(errors[0], /holds version 1\.4\.1 but this release is 1\.5\.0/);
});

test('a draft holding the expected version passes', () => {
  const { errors } = interpretItem(
    { uploadState: 'SUCCESS', crxVersion: '1.5.0' },
    { expectedVersion: '1.5.0' },
  );
  assert.deepEqual(errors, []);
});

test('a missing item resource is an error rather than a crash', () => {
  assert.equal(interpretItem(null).errors.length, 1);
  assert.equal(interpretItem({}).errors.length, 1);
});

test('publish OK is success', () => {
  const { errors, notes } = interpretPublish({ status: ['OK'] });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /queued for review/);
});

test('publish failure surfaces the status and its detail', () => {
  const { errors } = interpretPublish({
    status: ['ITEM_NOT_UPDATABLE'],
    statusDetail: ['Item is currently in review'],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /ITEM_NOT_UPDATABLE: Item is currently in review/);
});

test('NOT_FOUND describes an absent operation, not an absent item', () => {
  const { errors, notes } = interpretItem({ uploadState: 'NOT_FOUND', crxVersion: '1.5.0' });
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /No upload operation in flight/);
  assert.doesNotMatch(notes.join(' '), /Unrecognised/);
});

test('NOT_FOUND still catches a draft stuck on the wrong version', () => {
  const { errors } = interpretItem(
    { uploadState: 'NOT_FOUND', crxVersion: '1.4.1' },
    { expectedVersion: '1.5.0' },
  );
  assert.equal(errors.length, 1);
});

test('publishItem reports OK as queued for review', async () => {
  const fake = async () => ({ ok: true, json: async () => ({ status: ['OK'] }) });
  const { errors, notes } = await publishItem('abc', 't', fake);
  assert.deepEqual(errors, []);
  assert.match(notes.join(' '), /queued for review/);
});

test('publishItem surfaces a status array returned on a 200', async () => {
  const fake = async () => ({
    ok: true,
    json: async () => ({ status: ['ITEM_NOT_UPDATABLE'], statusDetail: ['Item is in review'] }),
  });
  const { errors } = await publishItem('abc', 't', fake);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /ITEM_NOT_UPDATABLE: Item is in review/);
});

test('publishItem reports an HTTP failure that carries no status', async () => {
  const fake = async () => ({ ok: false, status: 403, json: async () => ({}) });
  const { errors } = await publishItem('abc', 't', fake);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /HTTP 403/);
});

test('publishItem prefers the status array over the HTTP code', async () => {
  // A 400 that still explains itself should report the explanation, not the code.
  const fake = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ status: ['NOT_AUTHORIZED'], statusDetail: ['Account cannot publish'] }),
  });
  const { errors } = await publishItem('abc', 't', fake);
  assert.match(errors[0], /NOT_AUTHORIZED: Account cannot publish/);
});

// ── Published version (v2 fetchStatus, #368) ────────────────────────────────
// Shapes follow the documented FetchItemStatusResponse:
// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus

const live = (version, extra = {}) => ({
  state: 'PUBLISHED',
  distributionChannels: [{ deployPercentage: 100, crxVersion: version }],
  ...extra,
});

test('statusUrl is the documented v2 path and escapes both ids', () => {
  assert.equal(
    statusUrl('pub-1', 'abc'),
    'https://chromewebstore.googleapis.com/v2/publishers/pub-1/items/abc:fetchStatus',
  );
  assert.match(statusUrl('a/b', 'c'), /publishers\/a%2Fb\/items\/c:fetchStatus$/);
});

test('revisionVersion takes the channel most users get during a staged rollout', () => {
  const r = revisionVersion({
    state: 'PUBLISHED',
    distributionChannels: [
      { deployPercentage: 10, crxVersion: '1.5.1' },
      { deployPercentage: 90, crxVersion: '1.5.0' },
    ],
  });
  assert.deepEqual(r, { state: 'PUBLISHED', version: '1.5.0', percentage: 90 });
});

test('revisionVersion reads an omitted deployPercentage as 0, not as missing', () => {
  const r = revisionVersion({ state: 'PUBLISHED', distributionChannels: [{ crxVersion: '1.5.0' }] });
  assert.equal(r.version, '1.5.0');
  assert.equal(r.percentage, 0);
});

test('draft equal to published says the version is live', () => {
  const { lines, warnings } = interpretStatus(
    { publishedItemRevisionStatus: live('1.5.1') },
    { draftVersion: '1.5.1' },
  );
  assert.deepEqual(warnings, []);
  assert.ok(lines.includes('published version: 1.5.1 (PUBLISHED)'));
  assert.match(lines.join('\n'), /Draft and published agree: 1\.5\.1 is live\./);
});

test('a submission pending review is reported as awaiting review', () => {
  const { lines, warnings } = interpretStatus(
    {
      publishedItemRevisionStatus: live('1.5.0'),
      submittedItemRevisionStatus: {
        state: 'PENDING_REVIEW',
        distributionChannels: [{ deployPercentage: 100, crxVersion: '1.5.1' }],
      },
    },
    { draftVersion: '1.5.1' },
  );
  assert.deepEqual(warnings, []);
  assert.ok(lines.includes('submitted version: 1.5.1 (PENDING_REVIEW)'));
  assert.match(lines.join('\n'), /Submitted 1\.5\.1 is awaiting review; the store still serves 1\.5\.0\./);
});

test('a staged submission says review passed but it is not live', () => {
  const { lines } = interpretStatus({
    publishedItemRevisionStatus: live('1.5.0'),
    submittedItemRevisionStatus: { state: 'STAGED', distributionChannels: [{ crxVersion: '1.5.1' }] },
  });
  assert.match(lines.join('\n'), /1\.5\.1 passed review and is staged/);
});

test('a draft ahead of published with no submission says it was never submitted', () => {
  // The v1.5.0 failure: uploaded, green, and never submitted.
  const { lines } = interpretStatus(
    { publishedItemRevisionStatus: live('1.4.1') },
    { draftVersion: '1.5.0' },
  );
  assert.match(lines.join('\n'), /Draft 1\.5\.0 differs from published 1\.4\.1 and is not submitted/);
});

test('a rejected submission is a warning', () => {
  const { warnings } = interpretStatus({
    publishedItemRevisionStatus: live('1.5.0'),
    submittedItemRevisionStatus: { state: 'REJECTED', distributionChannels: [{ crxVersion: '1.5.1' }] },
  });
  assert.match(warnings.join(' '), /REJECTED submitted version 1\.5\.1/);
});

test('a partial rollout shows its percentage', () => {
  const { lines } = interpretStatus({
    publishedItemRevisionStatus: { state: 'PUBLISHED', distributionChannels: [{ deployPercentage: 25, crxVersion: '1.5.1' }] },
  });
  assert.ok(lines.includes('published version: 1.5.1 (PUBLISHED, 25% rollout)'));
});

test('a never-published item says so instead of guessing', () => {
  const { lines, warnings } = interpretStatus({}, { draftVersion: '1.0.0' });
  assert.deepEqual(warnings, []);
  assert.match(lines.join(' '), /no published revision/);
});

test('a published revision without a crxVersion is a warning, not a silent "(unknown)"', () => {
  // The #368 symptom, now loud.
  const { lines, warnings } = interpretStatus(
    { publishedItemRevisionStatus: { state: 'PUBLISHED', distributionChannels: [] } },
    { draftVersion: '1.5.1' },
  );
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /no crxVersion/);
  assert.doesNotMatch(lines.join(' '), /agree|awaiting/);
});

test('takedown and policy warnings are surfaced', () => {
  const { warnings } = interpretStatus({ takenDown: true, warned: true, publishedItemRevisionStatus: live('1.5.0') });
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /TAKEN DOWN/);
});

test('a non-object status is a warning', () => {
  assert.equal(interpretStatus(null).warnings.length, 1);
});

test('fetchPublishedStatus calls v2 with the bearer token and reads the answer', async () => {
  let seen;
  const fake = async (url, init) => {
    seen = { url, init };
    return { ok: true, json: async () => ({ publishedItemRevisionStatus: live('1.5.0') }) };
  };
  const { lines, warnings } = await fetchPublishedStatus('pub', 'abc', 'tok', {
    draftVersion: '1.5.0',
    fetchImpl: fake,
  });
  assert.equal(seen.url, 'https://chromewebstore.googleapis.com/v2/publishers/pub/items/abc:fetchStatus');
  assert.equal(seen.init.headers.Authorization, 'Bearer tok');
  assert.deepEqual(warnings, []);
  assert.match(lines.join('\n'), /1\.5\.0 is live/);
});

test('fetchPublishedStatus without a publisher id warns and makes no request', async () => {
  let called = false;
  const { warnings } = await fetchPublishedStatus('', 'abc', 'tok', {
    fetchImpl: async () => { called = true; },
  });
  assert.equal(called, false);
  assert.match(warnings[0], /CHROME_PUBLISHER_ID is not set/);
});

test('fetchPublishedStatus turns an HTTP error into a warning with Google\'s reason', async () => {
  const fake = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ error: { status: 'PERMISSION_DENIED', message: 'Insufficient scope' } }),
  });
  const { warnings } = await fetchPublishedStatus('pub', 'abc', 'tok', { fetchImpl: fake });
  assert.match(warnings[0], /HTTP 403 \(PERMISSION_DENIED: Insufficient scope\)/);
});

test('fetchPublishedStatus survives a network failure', async () => {
  const fake = async () => { throw new Error('ECONNRESET'); };
  const { warnings } = await fetchPublishedStatus('pub', 'abc', 'tok', { fetchImpl: fake });
  assert.match(warnings[0], /ECONNRESET/);
});

test('expectedVersionFrom compares after an upload, never in the login check', () => {
  assert.equal(expectedVersionFrom({ RELEASE_TAG: 'v1.7.0' }), '1.7.0');
  assert.equal(expectedVersionFrom({ RELEASE_TAG: 'refs/tags/v1.7.0' }), '1.7.0');
  assert.equal(expectedVersionFrom({}), '');
  // v1.7.0's first attempt: the login job inherited RELEASE_TAG while the store held 1.6.0.
  assert.equal(expectedVersionFrom({ RELEASE_TAG: 'v1.7.0', STORE_CHECK: 'login' }), '');
  assert.deepEqual(
    interpretItem({ crxVersion: '1.6.0', uploadState: 'NOT_FOUND' }, {
      expectedVersion: expectedVersionFrom({ RELEASE_TAG: 'v1.7.0', STORE_CHECK: 'login' }),
    }).errors,
    [],
  );
});

// The pre-deploy login checks run before any upload, in jobs that inherit RELEASE_TAG
// (release.yml sets it workflow-wide). Each must declare STORE_CHECK: login.
for (const [file, job] of [
  ['release.yml', 'store-login'],
  ['release-rehearsal.yml', 'store-login'],
]) {
  test(`${file} ${job} runs the store check in login mode`, () => {
    const text = readFileSync(new URL(`../workflows/${file}`, import.meta.url), 'utf8');
    const start = text.indexOf(`\n  ${job}:\n`);
    assert.notEqual(start, -1, `${file} has no ${job} job`);
    const rest = text.slice(start + 1);
    const next = rest.slice(1).search(/\n  [a-z][\w-]*:\n/);
    const block = next === -1 ? rest : rest.slice(0, next + 1);
    assert.match(block, /report-store-status\.mjs/);
    assert.match(block, /^\s+STORE_CHECK: login$/m);
  });
}
