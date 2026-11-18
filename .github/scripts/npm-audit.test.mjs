import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { auditVerdict } from "./npm-audit.mjs";

const TODAY = "2026-11-18";

function advisory(id, severity = "high") {
  return {
    source: 1,
    url: `https://github.com/advisories/${id}`,
    severity,
    title: "t",
    range: "<=1",
  };
}

// The shape npm audit --json emits: the vulnerable package carries the
// advisory object, everything above it carries only names.
const report = {
  vulnerabilities: {
    picomatch: { via: [advisory("GHSA-aaaa")] },
    vite: { via: ["picomatch", "tinyglobby"] },
  },
};

const entry = {
  id: "GHSA-aaaa",
  packages: ["picomatch"],
  expires: "2026-12-31",
  reason: "r",
};

test("an unlisted high advisory fails", () => {
  assert.equal(auditVerdict(report, [], TODAY).errors.length, 1);
});

test("a listed, unexpired advisory passes and is reported as allowed", () => {
  const v = auditVerdict(report, [entry], TODAY);
  assert.deepEqual(v.errors, []);
  assert.equal(v.allowed.length, 1);
});

test("an expired entry fails even though it still matches", () => {
  const v = auditVerdict(report, [{ ...entry, expires: "2026-11-17" }], TODAY);
  assert.equal(v.errors.length, 2);
  assert.match(v.errors[0], /expired/);
});

test("an entry does not cover the same advisory in a package it does not list", () => {
  const r = {
    vulnerabilities: {
      ...report.vulnerabilities,
      micromatch: { via: [advisory("GHSA-aaaa")] },
    },
  };
  assert.equal(auditVerdict(r, [entry], TODAY).errors.length, 1);
});

test("a different advisory in the same package still fails", () => {
  const r = {
    vulnerabilities: {
      picomatch: { via: [advisory("GHSA-aaaa"), advisory("GHSA-bbbb")] },
    },
  };
  assert.equal(auditVerdict(r, [entry], TODAY).errors.length, 1);
});

test("moderate and low advisories never fail, as with --audit-level=high", () => {
  const r = {
    vulnerabilities: {
      x: {
        via: [advisory("GHSA-cccc", "moderate"), advisory("GHSA-dddd", "low")],
      },
    },
  };
  assert.deepEqual(auditVerdict(r, [], TODAY).errors, []);
});

test("critical fails", () => {
  const r = {
    vulnerabilities: { x: { via: [advisory("GHSA-eeee", "critical")] } },
  };
  assert.equal(auditVerdict(r, [], TODAY).errors.length, 1);
});

test("a clean report passes", () => {
  assert.deepEqual(auditVerdict({ vulnerabilities: {} }, [], TODAY).errors, []);
});

test("every committed allowlist entry is complete", () => {
  const list = JSON.parse(
    readFileSync(new URL("../audit-allowlist.json", import.meta.url), "utf8"),
  ).advisories;
  for (const e of list) {
    assert.match(e.id, /^GHSA-/, "id is a GHSA id");
    assert.ok(
      Array.isArray(e.packages) && e.packages.length,
      `${e.id}: packages`,
    );
    assert.match(e.expires, /^\d{4}-\d{2}-\d{2}$/, `${e.id}: expires`);
    assert.ok(e.reason?.length > 40, `${e.id}: a real reason`);
  }
});
