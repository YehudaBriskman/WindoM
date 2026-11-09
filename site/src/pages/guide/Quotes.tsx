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
        A quote sits at the bottom of the new tab and changes once a day. With API Quotes, click it for another one.
      </p>
      <p>
        In Settings → <strong>Quotes</strong>, <strong>Show daily quotes</strong> turns it on or off, and{' '}
        <strong>Quote Source</strong> chooses between <strong>Local Quotes</strong>, a collection that ships with the
        extension, and <strong>API Quotes</strong>, fetched from the Quotable service.
      </p>
      <h2>How it works</h2>
      <p>
        The quote is shown as the text in quotation marks with the author on a line beneath it, preceded by a dash.
        Where it comes from depends on <strong>Quote Source</strong>.
      </p>
      <ul>
        <li>
          <strong>Local Quotes</strong> - the extension reads a collection that ships inside it, so no network request
          is made. The day's quote is chosen from the date: every new tab opened on the same day shows the same quote,
          and the choice changes when the date does. If the collection cannot be read, a short built-in list of five
          quotes is used instead.
        </li>
        <li>
          <strong>API Quotes</strong> - each time the new tab loads, the extension asks the Quotable service for a
          random quote. If that request fails, it falls back to a random quote from the local collection, so the space
          is not left empty.
        </li>
      </ul>
      <p>
        Whichever source you use, the quote fades out and in when it changes, and it refreshes by itself at local
        midnight while the new tab stays open.
      </p>

      <h2>Every setting explained</h2>
      <ul>
        <li>
          <strong>Show daily quotes</strong> (Settings → Quotes) - on by default. When off, the quote is removed from
          the page and nothing is loaded for it.
        </li>
        <li>
          <strong>Quote Source</strong> (Settings → Quotes) - <strong>Local Quotes</strong> is the default;{' '}
          <strong>API Quotes</strong> switches to the Quotable service.
        </li>
        <li>
          <strong>Quotes</strong> under Settings → General → Widget Visibility - the same on/off switch as{' '}
          <strong>Show daily quotes</strong>, repeated alongside the other widgets for convenience.
        </li>
      </ul>

      <h2>Clicking the quote</h2>
      <p>
        The quote is a button: click it to ask for a new one. With <strong>API Quotes</strong>, every click fetches a
        fresh random quote. With <strong>Local Quotes</strong>, the quote is picked from the date, so a click shows the
        day's quote again rather than a different one. If you want variety within a day, use API Quotes.
      </p>

      <h2>Where your data is stored and what leaves your device</h2>
      <ul>
        <li>
          The settings above are saved with the rest of your WindoM settings. If you sign in to a WindoM account, they
          are synced with your account like the other settings.
        </li>
        <li>
          The day's local quote is remembered together with its date, so the same quote is shown for the rest of the
          day.
        </li>
        <li>
          With <strong>Local Quotes</strong>, nothing about quotes leaves your device. With <strong>API Quotes</strong>,
          the extension contacts <code>api.quotable.io</code> to fetch a quote, which, like any web request, reveals
          your IP address to that service. No text you have typed in WindoM is part of that request.
        </li>
      </ul>
      <p>
        The <Link to="/privacy">Privacy Policy</Link> lists every service the extension talks to.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>
          Prefer <strong>Local Quotes</strong> if you want a page that loads the same way with no connection and no
          third-party request.
        </li>
        <li>
          Choose <strong>API Quotes</strong> if you like a different quote each time you open a tab; clicking the quote
          gives you another one.
        </li>
        <li>
          For a bare page, switch the quote off. Several <Link to="/guide/templates">templates</Link> show or hide it as
          part of their layout, and you can change the choice afterwards.
        </li>
      </ul>

      <h2>Common questions</h2>
      <p>
        <strong>Can I add my own quotes?</strong> There is no setting for this. The local collection ships with the
        extension and the API source is controlled by the service.
      </p>
      <p>
        <strong>Why is the quote the same every time I open a tab?</strong> You are on <strong>Local Quotes</strong>,
        which shows one quote per day. Switch to API Quotes for a new one on every tab.
      </p>
      <p>
        <strong>Can I choose a category or topic?</strong> No. There is no category filter.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No quote is shown</strong> - check that <strong>Show daily quotes</strong> is on in Settings → Quotes.
        </li>
        <li>
          <strong>With API Quotes I keep seeing quotes from a small set</strong> - when the Quotable service cannot be
          reached, the extension quietly uses the local collection instead. Check your connection and reload the tab.
        </li>
        <li>
          <strong>Clicking the quote shows the same one</strong> - expected with <strong>Local Quotes</strong>; see
          "Clicking the quote" above.
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
