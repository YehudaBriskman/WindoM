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
      <h2>How it works</h2>
      <p>
        The search box is a layer that WindoM adds on top of the page you are viewing. It is always laid out left to
        right, whatever the direction of the site underneath. It opens and closes with <kbd>Ctrl</kbd> + <kbd>Win</kbd>{' '}
        + <kbd>H</kbd> (<kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd> on a Mac), and clicking outside the box closes
        it too. When it opens, the cursor is already in the field.
      </p>
      <p>Suggestions appear a moment after you stop typing, in this order, with a short cap on each kind:</p>
      <ol>
        <li>
          <strong>Open tabs</strong> - up to three tabs whose title or address contains what you typed, marked{' '}
          <strong>Switch</strong>. Chrome's own pages are not included.
        </li>
        <li>
          <strong>History</strong> - up to four pages, left out if they are already shown as an open tab. This needs{' '}
          <Link to="/guide/history">Tab History</Link> to be on and its permission to be granted.
        </li>
        <li>
          <strong>Web suggestions</strong> - up to five search phrases from DuckDuckGo's autocomplete. If the request
          takes longer than about two seconds it is dropped and you simply see no web suggestions.
        </li>
      </ol>

      <h2>Keys inside the search box</h2>
      <ul>
        <li>
          <kbd>↓</kbd> and <kbd>↑</kbd> move through the suggestions. Going down from the last one returns to the first;
          going up from the first returns to the field.
        </li>
        <li>
          <kbd>Enter</kbd> opens the highlighted suggestion, or, with nothing highlighted, whatever you typed.
        </li>
        <li>
          <kbd>Escape</kbd> closes the suggestion list first. Press it again to close the box.
        </li>
        <li>
          <kbd>Tab</kbd> keeps the cursor in the field instead of moving to other controls.
        </li>
      </ul>
      <p>
        See <Link to="/guide/shortcuts">Keyboard Shortcuts</Link> for every key in the extension.
      </p>

      <h2>What Enter does</h2>
      <ul>
        <li>
          If what you typed looks like an address, WindoM goes there. That means anything starting with{' '}
          <code>http://</code> or <code>https://</code>, <code>localhost</code> (with or without a port), or a name with
          a dot and a domain ending such as <code>github.com</code>, which is opened as <code>https://</code>.
        </li>
        <li>Otherwise it searches for your text with the engine shown in the pill.</li>
        <li>
          A tab suggestion switches to that tab. A history or web suggestion loads in the current tab, replacing the
          page you were on.
        </li>
        <li>
          In <code>&gt;</code> command mode (below), the result opens in a new tab instead.
        </li>
      </ul>

      <h2>Every setting explained</h2>
      <p>
        There is one search setting, the <strong>search engine</strong>. It is changed from the pill beside the box, not
        from the Settings panel, and your choice is remembered.
      </p>
      <ul>
        <li>
          <strong>Google</strong> - the default.
        </li>
        <li>
          <strong>Bing</strong>
        </li>
        <li>
          <strong>DDG</strong> - DuckDuckGo, abbreviated on the pill.
        </li>
        <li>
          <strong>Brave</strong> - Brave Search.
        </li>
      </ul>
      <p>
        The engine decides where a search goes when you press Enter. It does not change the suggestions, which always
        come from DuckDuckGo. Suggestions from your history also depend on Tab History being switched on.
      </p>

      <h2>Command mode</h2>
      <p>
        Typing <code>&gt;</code> at the start switches the box to command mode: the icon and the placeholder change to{' '}
        <em>Type a command…</em>, and the usual suggestions are replaced by the list of commands. Type after the{' '}
        <code>&gt;</code> to narrow the list; each command answers to its name and to short forms.
      </p>
      <ul>
        <li>
          <strong>New Tab</strong> - opens a blank tab. Short forms: <code>n</code>, <code>new</code>, <code>tab</code>,{' '}
          <code>open</code>.
        </li>
        <li>
          <strong>Close Tab</strong> - closes the tab you are on. Short forms: <code>c</code>, <code>x</code>,{' '}
          <code>close</code>, <code>exit</code>, <code>quit</code>.
        </li>
        <li>
          <strong>Reload Page</strong> - reloads the page. Short forms: <code>r</code>, <code>reload</code>,{' '}
          <code>refresh</code>.
        </li>
        <li>
          <strong>Duplicate Tab</strong> - opens a copy of the current tab. Short forms: <code>d</code>,{' '}
          <code>dup</code>, <code>duplicate</code>, <code>clone</code>, <code>copy</code>.
        </li>
        <li>
          <strong>Pin / Unpin Tab</strong> - toggles whether the current tab is pinned. Short forms: <code>p</code>,{' '}
          <code>pin</code>, <code>unpin</code>.
        </li>
      </ul>
      <p>
        If your text matches no command, a single entry offers to open it in a new tab: as an address if it looks like
        one, otherwise as a search with your chosen engine.
      </p>

      <h2>Where your data is stored and what leaves your device</h2>
      <ul>
        <li>
          <strong>Stays in the browser</strong> - the list of open tabs, history suggestions and the commands. WindoM
          reads tab titles and addresses through Chrome's <code>tabs</code> permission, and history only when you have
          turned on Tab History and granted its optional permission.
        </li>
        <li>
          <strong>Sent to DuckDuckGo as you type</strong> - the text in the box, to fetch web suggestions. This does not
          happen in command mode.
        </li>
        <li>
          <strong>Sent to your chosen engine when you press Enter</strong> - the search text, as with any search.
        </li>
        <li>
          <strong>Saved</strong> - your engine choice, with your other settings.
        </li>
      </ul>
      <p>
        See the <Link to="/privacy">Privacy Policy</Link> for details.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>
          Use the box as a tab switcher: type a few letters of a page's title and pick the entry marked{' '}
          <strong>Switch</strong>, instead of opening a duplicate.
        </li>
        <li>
          Use <code>&gt;</code> commands to manage tabs without leaving the keyboard, for example <code>&gt;p</code>{' '}
          then <kbd>Enter</kbd> to pin the current tab.
        </li>
        <li>
          Keep the <Link to="/guide/tab-sidebar">Tab Sidebar</Link> for browsing your tabs with the mouse and the search
          box for finding one by name.
        </li>
      </ul>

      <h2>Common questions</h2>
      <p>
        <strong>Can I change the shortcut?</strong> Not in the extension; see{' '}
        <Link to="/guide/shortcuts">Keyboard Shortcuts</Link>.
      </p>
      <p>
        <strong>Can I add another search engine?</strong> No. The four above are the only ones.
      </p>
      <p>
        <strong>Why are there no web suggestions?</strong> They come from DuckDuckGo, so they need a connection and they
        are skipped in command mode.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Nothing happens when I press the shortcut</strong> - you may be on one of Chrome's own pages, where
          extensions cannot run. Check that you are holding all three keys, with <kbd>Win</kbd> (or <kbd>Cmd</kbd> on a
          Mac) as the middle one.
        </li>
        <li>
          <strong>No history suggestions</strong> - turn on <Link to="/guide/history">Tab History</Link> and accept the
          permission prompt.
        </li>
        <li>
          <strong>A command did nothing</strong> - commands run from the page you opened the box on, so Close, Duplicate
          and Pin act on that page's tab.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/history">Tab History</Link> - turns on history suggestions
        </li>
        <li>
          <Link to="/guide/tab-sidebar">Tab Sidebar</Link> - the list of open tabs
        </li>
        <li>
          <Link to="/guide/shortcuts">Keyboard Shortcuts</Link>
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
