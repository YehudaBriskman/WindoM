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
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
