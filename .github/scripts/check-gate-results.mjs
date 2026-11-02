import { pathToFileURL } from 'node:url';

/**
 * The gate's verdict: every prerequisite job must have SUCCEEDED.
 *
 * The summary job used to fail only when a result was `failure` or
 * `cancelled`. A `skipped` job passed it - and a skipped job is evidence of
 * nothing. Today every gate job runs unconditionally, so a skip means
 * something upstream went wrong (a failed `needs`, an `if:` someone added
 * later); that is exactly when the gate must not report green.
 *
 * @param {Record<string, {result?: string}>} needs  the `needs` context as JSON
 * @param {string[]} required  job ids that must be present
 * @returns {string[]} one message per problem; empty means release may proceed
 */
export function gateErrors(needs, required) {
  const errors = [];
  if (!needs || typeof needs !== 'object') return ['The gate received no job results at all.'];
  for (const id of required) {
    if (!(id in needs)) errors.push(`${id}: no result - the summary is not wired to this job`);
  }
  for (const [id, job] of Object.entries(needs)) {
    const result = job?.result ?? 'missing';
    if (result !== 'success') errors.push(`${id}: ${result}`);
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let needs;
  try {
    needs = JSON.parse(process.env.NEEDS_JSON ?? '');
  } catch {
    needs = null;
  }
  const required = (process.env.REQUIRED_JOBS ?? '').split(/[\s,]+/).filter(Boolean);
  const errors = required.length ? gateErrors(needs, required) : ['REQUIRED_JOBS is empty'];
  for (const [id, job] of Object.entries(needs ?? {})) console.log(`${id.padEnd(12)} ${job?.result}`);
  for (const error of errors) console.log(`::error::${error}`);
  if (errors.length) {
    console.log('::error::Release gate failed - nothing will be deployed or published.');
    process.exitCode = 1;
  } else {
    console.log('Every gate job succeeded.');
  }
}
