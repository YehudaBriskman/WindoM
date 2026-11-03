import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * After the deploy: every running app machine runs the image the gate scanned.
 *
 * The deploy pushes the gate's own image to registry.fly.io under a per-commit
 * tag, records the digest the registry assigned, and deploys that tag. A tag
 * is a name, not a promise, so this reads what Fly actually started
 * (`fly machine list --json`, `.image_ref.digest`) and compares digests.
 *
 * The short-lived release_command machine is excluded: it runs the migrations
 * and is destroyed, so it is not serving.
 *
 * @param {unknown} machines  parsed `fly machine list --json`
 * @param {string} digest     sha256:... the registry assigned to the push
 * @returns {string[]} one message per problem; empty means production runs it
 */
export function deployedImageErrors(machines, digest) {
  if (!/^sha256:[0-9a-f]{64}$/.test(digest ?? '')) return [`No pushed digest to compare against (got "${digest}")`];
  if (!Array.isArray(machines)) return ['fly machine list returned no machine list'];

  const serving = machines.filter(
    (m) => m?.state === 'started' && m?.config?.metadata?.fly_process_group !== 'fly_app_release_command',
  );
  if (!serving.length) return ['No started app machine was found, so nothing can be shown to run the image'];

  return serving
    .filter((m) => m?.image_ref?.digest !== digest)
    .map((m) => `Machine ${m.id} (${m.region}) runs ${m?.image_ref?.digest ?? 'an unknown image'}, not ${digest}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let machines = null;
  try {
    machines = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  } catch {
    machines = null;
  }
  const errors = deployedImageErrors(machines, process.env.EXPECTED_DIGEST);
  for (const error of errors) console.log(`::error::${error}`);
  if (errors.length) {
    console.log(`::error::Production is not running the expected image (${process.env.EXPECTED_DIGEST}). See docs/deployment-runbook.md.`);
    process.exitCode = 1;
  } else {
    console.log(`Every started app machine runs ${process.env.EXPECTED_DIGEST}.`);
  }
}
