import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ageInDays,
  buildSummary,
  evaluateDrift,
  parseReleasesJson,
  selectDeployedRelease,
} from './check-deploy-drift.mjs';

// ── parseReleasesJson ──────────────────────────────────────────────────────────

test('parses a well-formed flyctl releases --json array', () => {
  const raw = JSON.stringify([
    { Version: 30, Status: 'complete', CreatedAt: '2026-04-25T10:00:00Z' },
    { Version: 29, Status: 'complete', CreatedAt: '2026-03-01T10:00:00Z' },
  ]);
  const { releases, error } = parseReleasesJson(raw);
  assert.equal(error, undefined);
  assert.equal(releases.length, 2);
  assert.deepEqual(releases[0], { version: 30, status: 'complete', createdAt: '2026-04-25T10:00:00Z' });
});

test('reports an error on empty flyctl output', () => {
  const { releases, error } = parseReleasesJson('');
  assert.equal(releases, undefined);
  assert.match(error, /no output/);
});

test('reports an error on output that is not JSON', () => {
  const { releases, error } = parseReleasesJson('flyctl: app not found');
  assert.equal(releases, undefined);
  assert.match(error, /not valid JSON/);
});

test('reports an error when the JSON is not an array', () => {
  const { releases, error } = parseReleasesJson(JSON.stringify({ Version: 30 }));
  assert.equal(releases, undefined);
  assert.match(error, /not a JSON array/);
});

test('drops entries missing a usable version, status, or date rather than failing the whole parse', () => {
  const raw = JSON.stringify([
    { Version: 30, Status: 'complete', CreatedAt: '2026-04-25T10:00:00Z' },
    { Status: 'complete', CreatedAt: '2026-04-25T10:00:00Z' }, // no Version
    { Version: 28, Status: 'complete', CreatedAt: 'not-a-date' }, // bad date
    'not an object',
    null,
  ]);
  const { releases, error } = parseReleasesJson(raw);
  assert.equal(error, undefined);
  assert.equal(releases.length, 1);
  assert.equal(releases[0].version, 30);
});

// ── selectDeployedRelease ──────────────────────────────────────────────────────

test('selects the highest-versioned complete release', () => {
  const releases = [
    { version: 28, status: 'complete', createdAt: '2026-01-01T00:00:00Z' },
    { version: 30, status: 'complete', createdAt: '2026-04-25T00:00:00Z' },
    { version: 31, status: 'failed', createdAt: '2026-05-01T00:00:00Z' },
  ];
  assert.equal(selectDeployedRelease(releases).version, 30);
});

test('falls back to the highest-versioned release of any status when none is complete', () => {
  const releases = [
    { version: 30, status: 'failed', createdAt: '2026-04-25T00:00:00Z' },
    { version: 29, status: undefined, createdAt: '2026-03-01T00:00:00Z' },
  ];
  assert.equal(selectDeployedRelease(releases).version, 30);
});

test('returns undefined when no releases are found', () => {
  assert.equal(selectDeployedRelease([]), undefined);
  assert.equal(selectDeployedRelease(undefined), undefined);
});

// ── ageInDays ──────────────────────────────────────────────────────────────────

test('computes whole days between a timestamp and now', () => {
  const now = new Date('2026-10-20T00:00:00Z');
  assert.equal(ageInDays('2026-04-25T00:00:00Z', now), 178);
});

test('clamps a release dated in the future to zero rather than a negative age', () => {
  const now = new Date('2026-04-25T00:00:00Z');
  assert.equal(ageInDays('2026-05-01T00:00:00Z', now), 0);
});

test('returns undefined for an unparseable timestamp', () => {
  assert.equal(ageInDays('not-a-date', new Date()), undefined);
});

// ── evaluateDrift ──────────────────────────────────────────────────────────────

test('reports no drift when both signals are zero', () => {
  const result = evaluateDrift({ ageDays: 0, commitsAhead: 0, thresholdDays: 14, thresholdCommits: 20 });
  assert.deepEqual(result, { exceeded: false, reasons: [] });
});

test('does not exceed when drift lands exactly on the threshold', () => {
  const result = evaluateDrift({ ageDays: 14, commitsAhead: 20, thresholdDays: 14, thresholdCommits: 20 });
  assert.deepEqual(result, { exceeded: false, reasons: [] });
});

test('exceeds on age alone, one day over the threshold', () => {
  const result = evaluateDrift({ ageDays: 15, commitsAhead: 0, thresholdDays: 14, thresholdCommits: 20 });
  assert.equal(result.exceeded, true);
  assert.equal(result.reasons.length, 1);
  assert.match(result.reasons[0], /15 day\(s\) old/);
});

test('exceeds on commit count alone, one commit over the threshold', () => {
  const result = evaluateDrift({ ageDays: 0, commitsAhead: 21, thresholdDays: 14, thresholdCommits: 20 });
  assert.equal(result.exceeded, true);
  assert.equal(result.reasons.length, 1);
  assert.match(result.reasons[0], /21 commit\(s\)/);
});

test('reports both reasons together when both signals exceed', () => {
  const result = evaluateDrift({ ageDays: 178, commitsAhead: 48, thresholdDays: 14, thresholdCommits: 20 });
  assert.equal(result.exceeded, true);
  assert.equal(result.reasons.length, 2);
});

test('ignores a missing commit count rather than treating it as drift', () => {
  const result = evaluateDrift({
    ageDays: 0, commitsAhead: undefined, thresholdDays: 14, thresholdCommits: 20,
  });
  assert.deepEqual(result, { exceeded: false, reasons: [] });
});

// ── buildSummary ───────────────────────────────────────────────────────────────

test('summary names the deployed version and tells the reader what to do when drift is exceeded', () => {
  const deployed = { version: 30, status: 'complete', createdAt: '2026-04-25T10:00:00Z' };
  const drift = evaluateDrift({ ageDays: 178, commitsAhead: 48, thresholdDays: 14, thresholdCommits: 20 });
  const summary = buildSummary({
    deployed, ageDays: 178, commitsAhead: 48, thresholdDays: 14, thresholdCommits: 20, drift,
  });
  assert.match(summary, /v30/);
  assert.match(summary, /178 day\(s\)/);
  assert.match(summary, /48/);
  assert.match(summary, /tag `vX\.Y\.Z`/);
});

test('summary says no action is needed when drift is within bounds', () => {
  const deployed = { version: 30, status: 'complete', createdAt: '2026-04-25T10:00:00Z' };
  const drift = evaluateDrift({ ageDays: 2, commitsAhead: 3, thresholdDays: 14, thresholdCommits: 20 });
  const summary = buildSummary({
    deployed, ageDays: 2, commitsAhead: 3, thresholdDays: 14, thresholdCommits: 20, drift,
  });
  assert.match(summary, /within the allowed drift window/);
});

test('summary tells the reader to investigate manually when no release could be identified', () => {
  const summary = buildSummary({ deployed: undefined });
  assert.match(summary, /No completed Fly release/);
  assert.match(summary, /flyctl releases -a windom-api/);
});

test('summary notes when the commit count is unavailable rather than hiding the field', () => {
  const deployed = { version: 30, status: 'complete', createdAt: '2026-04-25T10:00:00Z' };
  const drift = evaluateDrift({ ageDays: 2, commitsAhead: undefined, thresholdDays: 14, thresholdCommits: 20 });
  const summary = buildSummary({
    deployed, ageDays: 2, commitsAhead: undefined, thresholdDays: 14, thresholdCommits: 20, drift,
  });
  assert.match(summary, /unavailable/);
});
