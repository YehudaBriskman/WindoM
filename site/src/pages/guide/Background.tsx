import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Backgrounds.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Background() {
  return (
    <DocsLayout path="/guide/background" eyebrow="User Guide" title="Change Your Background">
      <p>
        WindoM starts with a set of built-in photos and needs nothing from you. You can switch to your own images, or to
        photos from Unsplash. The choice is under Settings → <strong>Background</strong> →{' '}
        <strong>Background Source</strong>.
      </p>
      <h2>Option A - Built-in and your own images</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open Settings → <strong>Background</strong> tab and set the source to <strong>Local Image</strong>. This is
            the default.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Pick one of the <strong>Built-in</strong> photos, or click the upload button and choose an image from your
            device. Uploaded images are stored locally - never uploaded anywhere - and the most recent ones stay listed
            under <strong>Local Photos</strong> so you can switch back.
          </p>
        </div>
      </div>
      <h2>Option B - Unsplash photos</h2>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open Settings → <strong>Background</strong> tab and set the source to <strong>Unsplash</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Unsplash needs an access key of your own, which is free. Go to{' '}
            <a href="https://unsplash.com/developers" target="_blank" rel="noreferrer">
              unsplash.com/developers
            </a>
            , create an app, copy its <strong>Access Key</strong> and paste it into <strong>Unsplash Access Key</strong>
            . Without a key a gradient is shown instead of a photo.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            Optionally, paste a <strong>Collection ID</strong> from Unsplash to curate the photo style. Left empty, you
            get random nature photos. To find a collection ID: go to{' '}
            <a href="https://unsplash.com/collections" target="_blank" rel="noreferrer">
              unsplash.com/collections
            </a>
            , open any collection, and copy the number from the URL - e.g.{' '}
            <code>
              unsplash.com/collections/<strong>4324303</strong>/...
            </code>
          </p>
        </div>
      </div>
      <h2>How it works</h2>
      <p>
        The photo sits behind everything on the new tab, under a light dark overlay that helps the clock and widgets
        stay readable. Which photo appears depends on <strong>Background Source</strong>:
      </p>
      <ul>
        <li>
          <strong>Local Image</strong> shows the photo you last picked or uploaded. If you have never picked one, it
          shows the first built-in photo.
        </li>
        <li>
          <strong>Unsplash</strong> asks Unsplash for one random landscape photo using your access key, and keeps it for
          24 hours. The first new tab you open after that fetches a new one. Photos from a collection you named come
          from that collection; otherwise the search is for nature.
        </li>
      </ul>
      <p>If an image cannot be loaded, WindoM falls back to a built-in gradient so the page is never blank.</p>

      <h2>Every setting explained</h2>
      <ul>
        <li>
          <strong>Background Source</strong> - <strong>Local Image</strong> (default) or <strong>Unsplash</strong>.
        </li>
        <li>
          <strong>Unsplash Access Key</strong> - empty by default. Required for the Unsplash source. Without it a
          gradient is shown and a notice appears in Settings.
        </li>
        <li>
          <strong>Unsplash Collection ID (optional)</strong> - empty by default. Limits Unsplash photos to one
          collection.
        </li>
        <li>
          <strong>Upload local background</strong> - the upload button on the Local Image source. It accepts image files
          up to 5 MB.
        </li>
        <li>
          <strong>Built-in</strong> - the photos that ship with the extension.
        </li>
        <li>
          <strong>Local Photos</strong> - your recent uploads. The list holds up to 5; a sixth upload removes the oldest
          one. Each upload has a heart to like it and a delete button.
        </li>
        <li>
          <strong>Unsplash Photos</strong> - on the Unsplash source, <strong>Recent</strong> lists photos WindoM has
          fetched for you (up to 50, newest first) and <strong>Liked</strong> lists the ones you have hearted. Click a
          photo to make it the current background.
        </li>
      </ul>

      <h2>Photo credit and liking photos</h2>
      <p>
        When an Unsplash photo is showing, a credit line appears on the page naming the photographer and linking to
        their Unsplash profile and to Unsplash itself. The heart beside it likes the photo so it is kept under{' '}
        <strong>Liked</strong> in Settings. Built-in and uploaded photos show no credit line.
      </p>

      <h2>Where your data is stored and what leaves your device</h2>
      <ul>
        <li>
          <strong>Uploaded images</strong> are stored in Chrome's local extension storage on this device. They are not
          uploaded to WindoM or anywhere else. A small thumbnail of each is kept for the list.
        </li>
        <li>
          <strong>Unsplash photos</strong> are the only thing that leaves your device. WindoM sends a request to{' '}
          <code>api.unsplash.com</code> with your access key, and then your browser loads the image itself. This happens
          only when the Unsplash source is selected.
        </li>
        <li>
          <strong>Per account.</strong> When you are signed in, your current uploaded background is stored under your
          account on this device, so different accounts in the same browser do not see each other's background. A
          background you set before signing in is copied to your account the first time you sign in.
        </li>
      </ul>
      <p>
        The <Link to="/privacy">privacy policy</Link> lists every service the extension contacts.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>
          Use a dark or low-contrast image if you keep the default white clock; bright photos make light text harder to
          read.
        </li>
        <li>
          To keep a particular look, stay on <strong>Local Image</strong> and upload a photo you like. It stays until
          you choose another.
        </li>
        <li>
          To get a steady style from Unsplash, set a <strong>Collection ID</strong>. Heart the photos you want to find
          again, since the <strong>Recent</strong> list is capped at 50.
        </li>
        <li>
          Large photos are easiest to manage after being resized to roughly your screen size, because uploads over 5 MB
          are rejected.
        </li>
      </ul>

      <h2>Common questions</h2>
      <h3>Do I need an Unsplash account?</h3>
      <p>
        You need an Unsplash developer app to get an Access Key, as described above. The built-in photos and your own
        images need nothing.
      </p>
      <h3>Does the Unsplash photo change on every new tab?</h3>
      <p>
        No. The current photo is kept for 24 hours. Picking a photo from <strong>Recent</strong> or{' '}
        <strong>Liked</strong> makes it the current one.
      </p>
      <h3>Which image types can I upload?</h3>
      <p>
        Any file your browser reports as an image, up to 5 MB. Anything else shows the message{' '}
        <em>Please select a valid image file</em>.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>A colorful gradient instead of a photo.</strong> On the Unsplash source this means there is no key, or
          the request failed. Open Settings → Background and read the notice above the key field.
        </li>
        <li>
          <strong>Invalid API key - check your Unsplash Access Key.</strong> Unsplash rejected the key. Check that you
          copied the <strong>Access Key</strong> from your Unsplash app and pasted it whole.
        </li>
        <li>
          <strong>Unsplash rate limit reached. Try again later.</strong> Unsplash limits how many requests a key can
          make. Wait, or switch to <strong>Local Image</strong> in the meantime.
        </li>
        <li>
          <strong>Image too large. Maximum size is 5MB.</strong> Resize or compress the photo and upload it again.
        </li>
        <li>
          Still stuck? See <Link to="/support">Support</Link>.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/clock">Clock, date and greeting</Link> - match the clock color to your photo
        </li>
        <li>
          <Link to="/guide/templates">Layout templates</Link> - preset arrangements of the widgets over your background
        </li>
        <li>
          <Link to="/guide/account">Create a WindoM Account</Link> - what signing in adds
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
