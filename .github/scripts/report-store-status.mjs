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
    // log: equal means shipped, draft ahead means still waiting on review.
    try {
      const live = await fetch(`${API}/${id}?projection=PUBLISHED`, { headers });
      const published = await live.json();
      console.log(`published version: ${published.crxVersion ?? '(unknown)'}`);
      if (published.crxVersion && item.crxVersion) {
        console.log(
          published.crxVersion === item.crxVersion
            ? 'Draft and published agree: this version is live.'
            : `Draft ${item.crxVersion} is ahead of published ${published.crxVersion} - awaiting review.`,
        );
      }
    } catch {
      console.log('published version: (could not be read)');
    }

    const { errors, notes } = interpretItem(item, { expectedVersion });
    for (const note of notes) console.log(note);
    for (const error of errors) console.error(`::error::${error}`);
    process.exitCode = errors.length ? 1 : 0;
  } catch (err) {
    console.error(`::error::Could not read the store's view of this item: ${err.message}`);
    process.exitCode = 1;
  }
}
