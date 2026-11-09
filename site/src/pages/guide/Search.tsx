import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Search.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Search() {
  return (
    <DocsLayout path="/guide/search" eyebrow="User Guide" title="Search">
      <h2>Overview</h2>

      <p>
        Press <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd> - <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd> on a Mac
        - to open a search box over the page you are on. It works on the new tab and on ordinary websites; extensions
        cannot run on Chrome's own pages, so it does not open there. The same keys close it, as does{' '}
        <strong>Escape</strong>.
      </p>
      <ul>
        <li>
          <strong>Type anything</strong> - suggestions come from your open tabs, then your history (on the new tab, once{' '}
          <Link to="/guide/history">Tab History</Link> is on), then the web. Pick a tab to switch to it rather than
          opening it again.
        </li>
        <li>
          <strong>Type an address</strong> - such as <code>github.com</code>, and <strong>Enter</strong> goes straight
          there.
        </li>
        <li>
          <strong>Choose the engine</strong> - the pill beside the box switches between Google, Bing, DuckDuckGo and
          Brave. Google is the default.
        </li>
        <li>
          <strong>
            Start with <code>&gt;</code>
          </strong>{' '}
          - for commands: New Tab, Close Tab, Reload Page, Duplicate Tab and Pin / Unpin Tab. Anything else after{' '}
          <code>&gt;</code> opens in a new tab.
        </li>
      </ul>
      <div className="callout">
        <strong>Where the web suggestions come from</strong> - whichever engine you search with, the suggestions under
        the box come from DuckDuckGo's autocomplete, so what you type is sent to DuckDuckGo as you type it. Tab and
        history suggestions never leave your browser.
      </div>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
