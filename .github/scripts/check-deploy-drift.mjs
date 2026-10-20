import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * Detects when the backend deployed to Fly (`windom-api`) has drifted behind
 * `origin/main` by more than a threshold, so production cannot again sit silently
 * stale the way it did before incident #307: release v30 deployed 25 Apr 2026 while
 * main accumulated 48 commits - including every security fix from Phases 10-13 - and
 * nothing alerted because `deploy-backend.yml` only triggers on a `v*` tag.
 *
 * The deployed image carries no embedded git SHA (backend/Dockerfile sets no
 * `org.opencontainers.image.revision` label, and `fly.toml` configures no build arg
 * for one), so no `flyctl` command reliably reports which commit is live -
 * `flyctl image show` surfaces the image digest, not the source commit. What
 * `flyctl releases --json` DOES reliably report is when the current release was
 * created, so this check uses the age of the latest complete release as its primary
 * signal, with the number of commits landed on `origin/main` since that date as a
 * secondary, approximate one (approximate because it counts commits by date, not by
 * ancestry - the deployed commit itself is unknown).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses the JSON `flyctl releases -a <app> --json` prints. Never throws. */
export function parseReleasesJson(rawOutput) {
  if (typeof rawOutput !== 'string' || !rawOutput.trim()) {
    return { releases: undefined, error: 'flyctl produced no output' };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    return { releases: undefined, error: 'flyctl output was not valid JSON' };
  }

  if (!Array.isArray(parsed)) {
    return { releases: undefined, error: 'flyctl output was not a JSON array of releases' };
  }

  const releases = parsed.map(normalizeRelease).filter((release) => release !== undefined);
  return { releases, error: undefined };
}

/** Keeps only the fields this check relies on, discarding a release flyctl can't date or number. */
function normalizeRelease(entry) {
  if (typeof entry !== 'object' || entry === null) return undefined;
  const version = typeof entry.Version === 'number' ? entry.Version : undefined;
  const createdAt = typeof entry.CreatedAt === 'string' ? entry.CreatedAt : undefined;
  if (version === undefined || createdAt === undefined || Number.isNaN(Date.parse(createdAt))) {
    return undefined;
  }
  return {
    version,
    createdAt,
    status: typeof entry.Status === 'string' ? entry.Status : undefined,
  };
}

/**
 * Picks the release flyctl considers currently live: the highest-versioned release
 * whose status is "complete" (a failed or still-running release never went live).
 * Falls back to the highest-versioned release of any status if none is marked
 * complete, so a single unexpected status string cannot hide a real deploy entirely.
 */
export function selectDeployedRelease(releases) {
  if (!Array.isArray(releases) || releases.length === 0) return undefined;
  const complete = releases.filter((release) => release.status === 'complete');
  const pool = complete.length > 0 ? complete : releases;
  return pool.reduce((latest, release) => (release.version > latest.version ? release : latest));
}

/** Whole days between an ISO timestamp and `now`. A future or unparseable timestamp clamps to 0/undefined. */
export function ageInDays(createdAt, now = new Date()) {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return undefined;
  const diffMs = now.getTime() - created;
  return diffMs <= 0 ? 0 : Math.floor(diffMs / MS_PER_DAY);
}

/**
 * Compares the two drift signals against their thresholds. Drift must EXCEED a
 * threshold to fail - landing exactly on it is still within bounds - so the next
 * scheduled run has room before a borderline value starts flapping the job.
 */
export function evaluateDrift({ ageDays, commitsAhead, thresholdDays, thresholdCommits }) {
  const reasons = [];
  if (typeof ageDays === 'number' && ageDays > thresholdDays) {
    reasons.push(`the deployed release is ${ageDays} day(s) old (threshold ${thresholdDays})`);
  }
  if (typeof commitsAhead === 'number' && commitsAhead > thresholdCommits) {
    reasons.push(
      `origin/main has ${commitsAhead} commit(s) since the deploy date (threshold ${thresholdCommits})`,
    );
  }
  return { exceeded: reasons.length > 0, reasons };
}

/** Markdown for $GITHUB_STEP_SUMMARY: names the deployed version, the drift, and the fix. */
export function buildSummary({ deployed, ageDays, commitsAhead, thresholdDays, thresholdCommits, drift }) {
  const lines = ['## Backend deploy drift', ''];

  if (!deployed) {
    lines.push(
      'No completed Fly release could be identified for `windom-api`.',
      '',
      'Investigate manually: `flyctl releases -a windom-api` and `flyctl status -a windom-api`.',
    );
    return lines.join('\n');
  }

  lines.push(
    `- Deployed release: **v${deployed.version}**, created \`${deployed.createdAt}\``,
    `- Age: **${ageDays} day(s)** (threshold: ${thresholdDays})`,
    commitsAhead === undefined
      ? '- Commits on `origin/main` since that date: unavailable'
      : `- Commits on \`origin/main\` since that date: **${commitsAhead}** (threshold: ${thresholdCommits})`,
    '',
  );

  if (drift.exceeded) {
    lines.push(
      `**Drift threshold exceeded** - ${drift.reasons.join('; ')}.`,
      '',
      'Production has not shipped recent main. Cut a release: tag `vX.Y.Z` on `main` ' +
        '(see `deploy-backend.yml`) once the next version bump is ready.',
    );
  } else {
    lines.push('Production is within the allowed drift window. No action needed.');
  }

  return lines.join('\n');
}

/** Appends to $GITHUB_STEP_SUMMARY when running in Actions; no-ops (does not throw) otherwise. */
function writeStepSummary(markdown) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  try {
    appendFileSync(path, `${markdown}\n`);
  } catch (error) {
    console.error(`::warning::Could not write GITHUB_STEP_SUMMARY: ${error.message}`);
  }
}

/** Counts commits on origin/main created on or after `sinceIso`. Returns undefined, never throws, on failure. */
function countCommitsSince(sinceIso) {
  try {
    const output = execFileSync(
      'git',
      ['rev-list', '--count', `--since=${sinceIso}`, 'origin/main'],
      { encoding: 'utf8' },
    );
    const count = Number(output.trim());
    return Number.isFinite(count) ? count : undefined;
  } catch (error) {
    console.error(`::warning::Could not count commits on origin/main: ${error.message}`);
    return undefined;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const thresholdDays = Number(process.env.DRIFT_THRESHOLD_DAYS ?? '14');
  const thresholdCommits = Number(process.env.DRIFT_THRESHOLD_COMMITS ?? '20');

  const releasesPath = process.env.RELEASES_JSON_PATH;
  let rawReleases = '';
  if (releasesPath) {
    try {
      rawReleases = readFileSync(releasesPath, 'utf8');
    } catch (error) {
      console.error(`::error::Could not read ${releasesPath}: ${error.message}`);
    }
  }

  const { releases, error } = parseReleasesJson(rawReleases);

  if (error) {
    console.error(`::error::${error}`);
    writeStepSummary(buildSummary({ deployed: undefined }));
    process.exitCode = 1;
  } else {
    const deployed = selectDeployedRelease(releases);

    if (!deployed) {
      console.error('::error::No completed Fly release was found for windom-api.');
      writeStepSummary(buildSummary({ deployed: undefined }));
      process.exitCode = 1;
    } else {
      const ageDays = ageInDays(deployed.createdAt);
      const commitsAhead = countCommitsSince(new Date(deployed.createdAt).toISOString());
      const drift = evaluateDrift({ ageDays, commitsAhead, thresholdDays, thresholdCommits });
      const summary = buildSummary({
        deployed, ageDays, commitsAhead, thresholdDays, thresholdCommits, drift,
      });

      console.log(summary);
      writeStepSummary(summary);

      if (drift.exceeded) {
        console.error(`::error::Backend deploy drift exceeds threshold: ${drift.reasons.join('; ')}.`);
      }
      process.exitCode = drift.exceeded ? 1 : 0;
    }
  }
}
