import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * A job that checks out the gate's commit (`ref: ${{ needs.gate.outputs.sha }}`)
 * into the workspace root sees the scripts as they were when the tag was cut. A
 * re-run of an older tag, or the first release after a script was added, then
 * fails with MODULE_NOT_FOUND - v1.7.0's GitHub release job did exactly that.
 * Such a job must run scripts from a second checkout of the workflow's own ref
 * (`release-tools/.github/scripts/...`), as `deploy` does.
 */
function jobs(text) {
  const out = [];
  const re = /^ {2}([a-z][\w-]*):\n/gm;
  const starts = [...text.matchAll(re)];
  starts.forEach((m, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : text.length;
    out.push({ name: m[1], body: text.slice(m.index, end) });
  });
  return out;
}

function checksOutGateCommitAtRoot(body) {
  // A checkout step whose `with:` has the gate ref and no `path:`.
  return body
    .split(/\n {6}- /)
    .some(
      (step) =>
        /ref: \$\{\{ needs\.gate\.outputs\.sha \}\}/.test(step) &&
        !/\n\s+path:/.test(step),
    );
}

test("jobs on the gate commit run release scripts from the workflow ref", () => {
  const text = readFileSync(
    new URL("../workflows/release.yml", import.meta.url),
    "utf8",
  );
  const offenders = [];
  for (const job of jobs(text.slice(text.indexOf("\njobs:\n")))) {
    if (!checksOutGateCommitAtRoot(job.body)) continue;
    for (const line of job.body.split("\n")) {
      if (
        /(^|[\s"'])\.github\/scripts\//.test(line) &&
        !line.trim().startsWith("#") &&
        !/sparse-checkout/.test(line)
      ) {
        offenders.push(`${job.name}: ${line.trim()}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});
