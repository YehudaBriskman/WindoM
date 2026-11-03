import { pathToFileURL } from 'node:url';

/**
 * Reports what the Chrome Web Store actually did with an upload.
 *
 * The upload action prints nothing at all - a successful publish and a silently
 * rejected one look identical in the log, ten seconds of nothing between the
 * step header and the next step. That cost a release: v1.5.0 went out, the step
 * was green, and the store kept serving 1.4.1 with no way to tell from CI
 * whether the submission was queued for review or had never landed.
 *
 * This asks the store directly and says which it was.
 */

const API = 'https://www.googleapis.com/chromewebstore/v1.1/items';
// The published half lives only in v2. v1.1 `items.get?projection=PUBLISHED`
// answered without a `crxVersion` on every run (#368), and its reference page
// is gone from developer.chrome.com - v2 `fetchStatus` is the documented source:
// https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus
const API_V2 = 'https://chromewebstore.googleapis.com/v2';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Turns an item resource into a verdict.
 *
 * `uploadState` describes the draft that was just uploaded, not what shoppers
 * see: SUCCESS means the package was accepted and is now a pending draft, which
 * is the normal state while review runs. The published version only changes
 * once review clears, so a green upload plus an unchanged store listing is
 * expected rather than a fault - and is exactly the pair that looked like a
 * failure from outside.
 */
export function interpretItem(item, { expectedVersion } = {}) {
  const errors = [];
  const notes = [];

  if (!item || typeof item !== 'object') {
    return { errors: ['Store returned no item resource'], notes };
  }

  const state = item.uploadState;
  if (state === 'FAILURE') {
    const detail = (item.itemError ?? [])
      .map((e) => e.error_detail ?? e.errorDetail ?? JSON.stringify(e))
      .join('; ');
    errors.push(`Store rejected the upload: ${detail || 'no detail given'}`);
  } else if (state === 'IN_PROGRESS') {
    notes.push('Upload still processing at the store; no verdict yet.');
  } else if (state === 'SUCCESS') {
    notes.push('Store accepted the package. It becomes public when review clears.');
  } else if (state === 'NOT_FOUND') {
    // Reported once no upload operation is in flight, which is the usual state
    // some hours after a release. It describes the absence of an operation, not
    // the absence of the item - crxVersion below is what says whether the
    // package landed.
    notes.push('No upload operation in flight; the draft below is what the store holds.');
  } else if (state) {
    notes.push(`Unrecognised uploadState: ${state}`);
  } else {
    errors.push('Store returned an item with no uploadState');
  }

  if (expectedVersion && item.crxVersion && item.crxVersion !== expectedVersion) {
    errors.push(
      `Store holds version ${item.crxVersion} but this release is ${expectedVersion}. ` +
      'The upload did not replace the draft.',
    );
  }
  return { errors, notes };
}

/** Publish responses report partial success in a status array, not an HTTP code. */
export function interpretPublish(body) {
  const errors = [];
  const notes = [];
  const statuses = body?.status ?? [];
  const details = (body?.statusDetail ?? []).join('; ');

  if (!statuses.length) {
    notes.push('Publish call returned no status.');
    return { errors, notes };
  }
  for (const status of statuses) {
    if (status === 'OK') notes.push('Publish accepted; the version is queued for review.');
    else errors.push(`Publish reported ${status}${details ? `: ${details}` : ''}`);
  }
  return { errors, notes };
}

/**
 * Submits the uploaded draft for review.
 *
 * The upload action takes a `publish: true` flag, and it does not do the job:
 * v1.5.0 uploaded cleanly and then sat in Draft with "Submit for review" still
 * waiting to be clicked, while the step reported success and printed nothing at
 * all. Making the call here means the response is read instead of discarded.
 */
export async function publishItem(id, token, fetchImpl = fetch) {
  const res = await fetchImpl(`${API}/${id}/publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2',
      'Content-Length': '0',
    },
  });
  const body = await res.json().catch(() => ({}));
  // A publish failure can arrive as an HTTP error or as a status array on a 200,
  // so neither alone is sufficient to call it success.
  if (!res.ok && !body.status) {
    return { errors: [`Publish call failed: HTTP ${res.status}`], notes: [] };
  }
  return interpretPublish(body);
}

/** The v2 status URL. Both ids are path segments, so neither may smuggle a `/`. */
export function statusUrl(publisherId, itemId) {
  return `${API_V2}/publishers/${encodeURIComponent(publisherId)}/items/${encodeURIComponent(itemId)}:fetchStatus`;
}

/**
 * Reads one ItemRevisionStatus. A revision can be split across distribution
 * channels during a staged rollout; the version that counts is the one the
 * largest share of users gets. `deployPercentage` is left out of the JSON when
 * it is 0, so a missing value is read as 0, not as unknown.
 */
export function revisionVersion(revision) {
  if (!revision || typeof revision !== 'object') return null;
  const channels = Array.isArray(revision.distributionChannels) ? revision.distributionChannels : [];
  const withVersion = channels.filter((c) => typeof c?.crxVersion === 'string' && c.crxVersion);
  const main = withVersion.reduce(
    (best, c) => ((c.deployPercentage ?? 0) > (best?.deployPercentage ?? -1) ? c : best),
    null,
  );
  return {
    state: revision.state ?? null,
    version: main?.crxVersion ?? null,
    percentage: main ? (main.deployPercentage ?? 0) : null,
  };
}

/**
 * Turns a v2 fetchStatus response into log lines.
 *
 * Advisory only: nothing here changes the exit code, because what the store
 * serves lags a release by however long review takes. But a published side that
 * cannot be read is a `warning`, never a quiet "(unknown)" - that silence is
 * how #368 went unnoticed.
 *
 * `draftVersion` is the v1.1 DRAFT reading, which v2 has no equivalent for: an
 * uploaded but unsubmitted package appears in neither revision below.
 */
export function interpretStatus(body, { draftVersion } = {}) {
  const lines = [];
  const warnings = [];

  if (!body || typeof body !== 'object') {
    warnings.push('fetchStatus returned no status resource; the published version is unknown.');
    return { lines, warnings };
  }
  if (body.takenDown) warnings.push('The store reports this item TAKEN DOWN for a policy violation. See the Developer Dashboard.');
  if (body.warned) warnings.push('The store has warned this item for a policy violation. See the Developer Dashboard.');

  const published = revisionVersion(body.publishedItemRevisionStatus);
  const submitted = revisionVersion(body.submittedItemRevisionStatus);

  if (!published) {
    // Documented: the field is unset when the item has never been published.
    lines.push('published version: (none - the store has no published revision)');
  } else if (!published.version) {
    warnings.push(
      `fetchStatus returned a published revision (state ${published.state ?? 'unset'}) with no crxVersion; the published version is unknown.`,
    );
  } else {
    const share = published.percentage !== null && published.percentage < 100 ? `, ${published.percentage}% rollout` : '';
    lines.push(`published version: ${published.version} (${published.state ?? 'state unset'}${share})`);
  }

  if (submitted) {
    lines.push(`submitted version: ${submitted.version ?? '(no crxVersion)'} (${submitted.state ?? 'state unset'})`);
    if (submitted.state === 'REJECTED') {
      warnings.push(`The store REJECTED submitted version ${submitted.version ?? '(unknown)'}. See the Developer Dashboard.`);
    }
  }

  // The one question anyone has: did it ship? Compare the newest thing we gave
  // the store - the submission if there is one, else the draft - with what it serves.
  const candidate = submitted?.version
    ? { label: 'Submitted', version: submitted.version, state: submitted.state }
    : draftVersion
      ? { label: 'Draft', version: draftVersion, state: null }
      : null;
  if (published?.version && candidate) {
    if (candidate.version === published.version) {
      lines.push(`${candidate.label} and published agree: ${published.version} is live.`);
    } else if (candidate.state === 'STAGED') {
      lines.push(`Submitted ${candidate.version} passed review and is staged; the store still serves ${published.version}.`);
    } else if (candidate.state === 'PENDING_REVIEW') {
      lines.push(`Submitted ${candidate.version} is awaiting review; the store still serves ${published.version}.`);
    } else if (candidate.label === 'Draft') {
      lines.push(
        `Draft ${candidate.version} differs from published ${published.version} and is not submitted for review.`,
      );
    } else {
      lines.push(`Submitted ${candidate.version} (${candidate.state ?? 'state unset'}); the store still serves ${published.version}.`);
    }
  }
  return { lines, warnings };
}

/** Never throws: a failed read becomes a warning, with whatever reason Google gave. */
export async function fetchPublishedStatus(publisherId, itemId, token, { draftVersion, fetchImpl = fetch } = {}) {
  if (!publisherId) {
    return {
      lines: [],
      warnings: ['CHROME_PUBLISHER_ID is not set, so the published version cannot be read (the v2 API needs it).'],
    };
  }
  let res;
  try {
    res = await fetchImpl(statusUrl(publisherId, itemId), { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    return { lines: [], warnings: [`fetchStatus request failed: ${err.message}`] };
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const reason = [body?.error?.status, body?.error?.message].filter(Boolean).join(': ');
    return {
      lines: [],
      warnings: [`fetchStatus failed: HTTP ${res.status}${reason ? ` (${reason})` : ''}; the published version is unknown.`],
    };
  }
  return interpretStatus(body, { draftVersion });
}

async function accessToken(env) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.CHROME_CLIENT_ID,
      client_secret: env.CHROME_CLIENT_SECRET,
      refresh_token: env.CHROME_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: HTTP ${res.status}`);
  const body = await res.json();
  if (!body.access_token) throw new Error('Token exchange returned no access_token');
  return body.access_token;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env;
  const id = env.CHROME_EXTENSION_ID;
  const expectedVersion = (env.RELEASE_TAG ?? '').replace(/^refs\/tags\//, '').replace(/^v/, '');

  try {
    const token = await accessToken(env);
    const headers = { Authorization: `Bearer ${token}`, 'x-goog-api-version': '2' };

    const draft = await fetch(`${API}/${id}?projection=DRAFT`, { headers });
    const item = await draft.json();
    // Never print the resource wholesale - it carries identifiers we do not need in a log.
    console.log(`uploadState: ${item.uploadState ?? '(none)'}`);
    if (item.crxVersion) console.log(`draft version: ${item.crxVersion}`);

    // The draft alone cannot say whether a release is live. Printing both makes
    // the one question anyone actually has - did it ship? - answerable from the
    // log. Advisory: it warns when it cannot answer, and never fails the step.
    const status = await fetchPublishedStatus(env.CHROME_PUBLISHER_ID, id, token, {
      draftVersion: item.crxVersion,
    });
    for (const line of status.lines) console.log(line);
    for (const warning of status.warnings) console.log(`::warning::${warning}`);

    const { errors, notes } = interpretItem(item, { expectedVersion });
    for (const note of notes) console.log(note);

    // Opt-in, because reading the store's state has to stay safe to run at will.
    if (env.SUBMIT_FOR_REVIEW === 'true') {
      console.log('Submitting the draft for review...');
      const submitted = await publishItem(id, token);
      for (const note of submitted.notes) console.log(note);
      errors.push(...submitted.errors);
      // Read again, so the log ends on what the submission produced -
      // "awaiting review" - rather than on the state before it.
      if (!submitted.errors.length) {
        const after = await fetchPublishedStatus(env.CHROME_PUBLISHER_ID, id, token, {
          draftVersion: item.crxVersion,
        });
        console.log('After submitting:');
        for (const line of after.lines) console.log(line);
        for (const warning of after.warnings) console.log(`::warning::${warning}`);
      }
    }

    for (const error of errors) console.error(`::error::${error}`);
    process.exitCode = errors.length ? 1 : 0;
  } catch (err) {
    console.error(`::error::Could not read the store's view of this item: ${err.message}`);
    process.exitCode = 1;
  }
}
