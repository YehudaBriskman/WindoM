import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for the keyboard: every key the extension responds to.
 *
 * The list is taken from the extension source. The manifest declares no
 * Chrome `commands`, so there is exactly one global shortcut, handled by the
 * page itself, and the rest are keys that work inside a particular panel.
 * The Hebrew page mirrors it.
 */
export function Shortcuts() {
  return (
    <DocsLayout path="/guide/shortcuts" eyebrow="User Guide" title="Keyboard Shortcuts">
      <h2>Overview</h2>

      <p>
        WindoM has one shortcut that works anywhere, and a small set of keys that work inside a particular panel. This
        page lists all of them.
      </p>

      <h2>The global shortcut</h2>
      <table>
        <thead>
          <tr>
            <th>Keys</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>H</kbd>
              <br />
              <kbd>Ctrl</kbd> + <kbd>Cmd</kbd> + <kbd>H</kbd> on a Mac
            </td>
            <td>
              Opens the <Link to="/guide/search">Search</Link> box over the current page. Press it again to close the
              box. It works on the new tab and on ordinary websites, but not on Chrome's own pages, where extensions
              cannot run.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Keys inside a panel</h2>
      <table>
        <thead>
          <tr>
            <th>Where</th>
            <th>Key</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Link to="/guide/search">Search</Link> box
            </td>
            <td>
              <kbd>↓</kbd> / <kbd>↑</kbd>
            </td>
            <td>Move through the suggestions or commands.</td>
          </tr>
          <tr>
            <td>Search box</td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>Open the highlighted suggestion, or run what you typed.</td>
          </tr>
          <tr>
            <td>Search box</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>Close the suggestion list; press again to close the box.</td>
          </tr>
          <tr>
            <td>Search box</td>
            <td>
              <kbd>Tab</kbd>
            </td>
            <td>Keeps the cursor in the field.</td>
          </tr>
          <tr>
            <td>
              <Link to="/guide/focus">Focus Mode</Link> field
            </td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>Save your main focus.</td>
          </tr>
          <tr>
            <td>Focus Mode countdown</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>Stop the countdown and bring the page back.</td>
          </tr>
          <tr>
            <td>
              Name in the <Link to="/guide/clock">greeting</Link>
            </td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>Save the name you edited.</td>
          </tr>
          <tr>
            <td>Name in the greeting</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>Cancel the edit and restore the saved name.</td>
          </tr>
          <tr>
            <td>
              Side panel (<Link to="/guide/todos">Tasks</Link>, calendar, history)
            </td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>Close the panel.</td>
          </tr>
          <tr>
            <td>Task field in the side panel</td>
            <td>
              <kbd>Enter</kbd>
            </td>
            <td>Add the task.</td>
          </tr>
          <tr>
            <td>Settings panel</td>
            <td>
              <kbd>Escape</kbd>
            </td>
            <td>Close the panel. If an app's detail view is open on top, the first press closes that instead.</td>
          </tr>
        </tbody>
      </table>
      <p>
        For the details of each feature, see <Link to="/guide/search">Search</Link> and{' '}
        <Link to="/guide/focus">Focus Mode</Link>.
      </p>

      <h2>Can I change the shortcuts?</h2>
      <p>
        No. WindoM does not register any commands with Chrome, so it does not appear on the{' '}
        <code>chrome://extensions/shortcuts</code> page and there is nothing to rebind there. The search shortcut is
        built into the extension and there is no setting to change it.
      </p>
      <div className="callout tip">
        <strong>Prefer the mouse?</strong> The search box also closes when you click outside it, Focus Mode has a{' '}
        <strong>Stop Focus</strong> button, and the side panel closes when you click outside it.
      </div>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>The search shortcut does nothing</strong> - you may be on a Chrome page such as the settings or
          extensions page, where extensions cannot run. Try it on an ordinary website or on the new tab.
        </li>
        <li>
          <strong>Escape closed more than I expected</strong> - each panel listens for Escape on its own. Press it again
          if a second panel is still open.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/search">Search</Link> - suggestions, engines and <code>&gt;</code> commands
        </li>
        <li>
          <Link to="/guide/focus">Focus Mode</Link> - the countdown and the focus field
        </li>
        <li>
          <Link to="/guide/tab-sidebar">Tab Sidebar</Link> - the open-tab panel, which is pointer-driven
        </li>
        <li>
          <Link to="/support">Support</Link>
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
