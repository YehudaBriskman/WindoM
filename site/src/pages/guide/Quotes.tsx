import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Daily Quotes.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Quotes() {
  return (
    <DocsLayout path="/guide/quotes" eyebrow="User Guide" title="Daily Quotes">
      <h2>Overview</h2>

      <p>
        A quote sits at the bottom of the new tab. It is chosen from the date, so it changes once a day, and you can
        click it to see a different one.
      </p>
      <p>
        In Settings → <strong>Quotes</strong>, <strong>Show daily quotes</strong> turns it on or off. The quotes come
        from a collection that ships with the extension.
      </p>

      <h2>How it works</h2>
      <p>
        The quote is shown as the text in quotation marks with the author on a line beneath it, preceded by a dash. The
        extension reads a collection bundled inside it, so no network request is made. The day's quote is chosen from
        the date: every new tab opened on the same day shows the same quote, and the choice changes when the date does.
        If the collection cannot be read, a short built-in list of five quotes is used instead.
      </p>
      <p>
        The quote fades out and in when it changes, and it refreshes by itself at local midnight while the new tab stays
        open.
      </p>

      <h2>Every setting explained</h2>
      <ul>
        <li>
          <strong>Show daily quotes</strong> (Settings → Quotes) - on by default. When off, the quote is removed from
          the page and nothing is loaded for it.
        </li>
        <li>
          <strong>Quotes</strong> under Settings → General → Widget Visibility - the same on/off switch as{' '}
          <strong>Show daily quotes</strong>, repeated alongside the other widgets for convenience.
        </li>
      </ul>

      <h2>Clicking the quote</h2>
      <p>
        The quote is a button: click it and a different quote from the same collection fades in. It is not saved, so the
        day's quote is untouched. Open a new tab, or wait for midnight, and you are back to the quote chosen for that
        date.
      </p>

      <h2>Where your data is stored and what leaves your device</h2>
      <ul>
        <li>
          The on/off setting is saved with the rest of your WindoM settings. If you sign in to a WindoM account, it is
          synced with your account like the other settings.
        </li>
        <li>
          The day's quote is remembered together with its date, so the same quote is shown for the rest of the day.
        </li>
        <li>Nothing about quotes leaves your device: there is no request to any service for them.</li>
      </ul>
      <p>
        The <Link to="/privacy">Privacy Policy</Link> lists every service the extension talks to.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>Click the quote if today's does not suit you; the page goes back to the day's quote on the next tab.</li>
        <li>
          For a bare page, switch the quote off. Several <Link to="/guide/templates">templates</Link> show or hide it as
          part of their layout, and you can change the choice afterwards.
        </li>
      </ul>

      <h2>Common questions</h2>
      <p>
        <strong>Can I add my own quotes?</strong> There is no setting for this. The collection ships with the extension.
      </p>
      <p>
        <strong>Why is the quote the same every time I open a tab?</strong> It is chosen from the date, so it stays the
        same for the whole day. Click it for a different one.
      </p>
      <p>
        <strong>Can I choose a category or topic?</strong> No. There is no category filter.
      </p>
      <p>
        <strong>What happened to API Quotes?</strong> The option fetched quotes from an outside service that is no
        longer available, so it was removed. If it was selected, you now see quotes from the bundled collection.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No quote is shown</strong> - check that <strong>Show daily quotes</strong> is on in Settings → Quotes.
        </li>
        <li>
          <strong>The same few quotes keep appearing</strong> - if the bundled collection cannot be read, the extension
          uses a built-in list of five quotes. Reload the tab; if it persists, see <Link to="/support">Support</Link>.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/templates">Templates</Link> - layouts that include or hide the quote
        </li>
        <li>
          <Link to="/guide/clock">Clock, Date &amp; Greeting</Link> - the other text on the page
        </li>
        <li>
          <Link to="/privacy">Privacy Policy</Link> and <Link to="/support">Support</Link>
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
