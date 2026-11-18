import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * `npm audit --audit-level=high`, with a written, expiring exception list.
 *
 * Plain `npm audit` cannot ignore one advisory. When a high advisory lands
 * with no patched release yet - GHSA-fc5q-39xc-vjpf hit picomatch <=4.0.7 on
 * 2026-11-18 while 4.0.7 was the newest version, and npm's only "fix" was a
 * downgrade to vite 6 - every PR in the repo goes red and the only levers
 * left are lowering the bar for everything or skipping the audit. This keeps
 * the bar and the step, and lets one advisory through on the record:
 *
 * - each entry names the advisory, says why it is not reachable, and carries
 *   an `expires` date; an expired entry fails the audit, so an exception
 *   cannot outlive the reason for it unnoticed;
 * - an entry covers only the packages it lists, so the same advisory turning
 *   up through a new route is still reported.
 *
 * The list is `.github/audit-allowlist.json`.
 */

const BLOCKING = new Set(["high", "critical"]);

/**
 * @param {object} report  `npm audit --json` output
 * @param {{id: string, packages: string[], expires: string, reason: string}[]} allowlist
 * @param {string} today  YYYY-MM-DD
 * @returns {{errors: string[], allowed: string[], unused: string[]}}
 */
export function auditVerdict(report, allowlist, today) {
  const errors = [];
  const allowed = [];
  const used = new Set();

  for (const entry of allowlist) {
    if (!entry.expires || entry.expires < today) {
      errors.push(
        `allowlist entry ${entry.id} expired on ${entry.expires} - re-assess it, then renew or remove it`,
      );
    }
  }

  for (const [name, vuln] of Object.entries(report?.vulnerabilities ?? {})) {
    // `via` mixes advisories (objects) with the names of dependencies that
    // pull a vulnerable one in (strings). Only the objects are findings; the
    // strings are the same finding seen from further up the tree.
    for (const via of vuln.via ?? []) {
      if (typeof via !== "object" || !BLOCKING.has(via.severity)) continue;
      const id =
        String(via.url ?? "")
          .split("/")
          .pop() || String(via.source);
      const entry = allowlist.find(
        (e) => e.id === id && e.packages.includes(name),
      );
      const line = `${name}: ${via.severity} ${id} ${via.title} (${via.range})`;
      if (entry && entry.expires >= today) {
        used.add(entry.id);
        allowed.push(line);
      } else {
        errors.push(line);
      }
    }
  }

  const unused = allowlist.filter((e) => !used.has(e.id)).map((e) => e.id);
  return {
    errors: [...new Set(errors)],
    allowed: [...new Set(allowed)],
    unused,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const allowlist = JSON.parse(
    readFileSync(new URL("../audit-allowlist.json", import.meta.url), "utf8"),
  ).advisories;
  const run = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(run.stdout);
  } catch {
    console.log(
      `::error::npm audit produced no JSON (exit ${run.status}): ${run.stderr.trim()}`,
    );
    process.exit(1);
  }
  if (report.error) {
    console.log(
      `::error::npm audit failed: ${report.error.summary ?? JSON.stringify(report.error)}`,
    );
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { errors, allowed, unused } = auditVerdict(report, allowlist, today);
  for (const line of allowed)
    console.log(`allowed by .github/audit-allowlist.json: ${line}`);
  // Not an error: the list is shared by every package, and an advisory that
  // only affects one of them is unused in the others.
  for (const id of unused)
    console.log(`allowlist entry ${id} matched nothing in this package`);
  for (const error of errors) console.log(`::error::${error}`);
  if (errors.length) process.exitCode = 1;
  else console.log("npm audit: no unallowed high or critical advisories.");
}
