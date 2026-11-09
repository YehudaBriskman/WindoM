import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Todos.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Todos() {
  return (
    <DocsLayout path="/guide/todos" eyebrow="User Guide" title="Todos">
      <h2>Overview</h2>

      <p>
        A simple task list, <strong>Today's Tasks</strong>, at the top of the sidebar. It is on from the start and needs
        no account.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>Click the list icon in the bottom-right corner of the new tab to open the sidebar.</p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Type in <strong>Add a new task...</strong> and press <strong>Enter</strong> or click <strong>+</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            Tick a task to mark it done, or click its <strong>×</strong> to remove it.
          </p>
        </div>
      </div>
      <div className="callout tip">
        <strong>Where tasks live</strong> - tasks are kept in Chrome's storage for your profile, not on WindoM's server,
        and every open new tab shows the same list. To hide the list, open Settings → <strong>Apps</strong> →{' '}
        <strong>Tasks</strong> and turn off <strong>Show in sidebar</strong>.
      </div>
      <h2>How it works</h2>
      <p>
        Tasks are saved the moment you add, tick or remove one, and every new tab you have open updates to match. The
        list is shown in the order you added things, oldest first. A task you tick stays in the list, marked as done,
        until you remove it with its <strong>×</strong>. While a change is being saved, that task's checkbox and{' '}
        <strong>×</strong> are briefly disabled so a double click cannot act on it twice.
      </p>
      <ul>
        <li>Blank entries are ignored, and text you add has leading and trailing spaces trimmed.</li>
        <li>
          With no tasks, the list reads <em>No tasks yet. Add one below.</em>
        </li>
        <li>
          The sidebar closes when you click outside it or press <kbd>Escape</kbd>, so you can reach it and dismiss it
          from the keyboard as well as the mouse.
        </li>
      </ul>

      <h2>Every setting explained</h2>
      <p>The task list has a single setting, under Settings → Apps → Tasks:</p>
      <ul>
        <li>
          <strong>Show in sidebar</strong> - on by default. When off, <strong>Today's Tasks</strong> is removed from the
          sidebar. Your saved tasks are kept, and they reappear when you turn it back on.
        </li>
      </ul>
      <p>
        The sidebar itself can be placed on the left or the right edge under Settings → General → Tab Sidebar. See the{' '}
        <Link to="/guide/tab-sidebar">Tab Sidebar</Link> page. The other sections of the sidebar, such as Calendar and
        Recent, are controlled separately.
      </p>

      <h2>Where your data is stored and what leaves your device</h2>
      <p>
        Tasks are stored in Chrome's extension storage under the <code>todos</code> key, in the same area that holds
        your settings. WindoM does not send them to its server, and you do not need an account to use them. Whether
        Chrome itself copies that storage to your other computers depends on your Chrome sync settings, which are
        managed by Chrome rather than by WindoM. See the <Link to="/privacy">privacy policy</Link> for what the
        extension does contact.
      </p>
      <div className="callout warn">
        <strong>Reset to Defaults deletes your tasks.</strong> The <strong>Reset to Defaults</strong> button in Settings
        → General clears the extension's synced Chrome storage before restoring default settings, and that storage is
        where tasks are kept. Remove anything you want to keep from the list first, or copy it somewhere else.
      </div>

      <h2>Tips and good setups</h2>
      <ul>
        <li>
          Keep the list short. It is named <em>Today's Tasks</em> for a reason: it works best as the handful of things
          you want to finish today, not a backlog.
        </li>
        <li>
          Write each task as a small, concrete action, such as <em>Send invoice to Dana</em>, so ticking it off is
          clear-cut.
        </li>
        <li>
          Clear ticked tasks at the end of the day by clicking their <strong>×</strong> to start the next day fresh.
        </li>
        <li>
          Pair the list with the <Link to="/guide/focus">Focus Mode</Link>: write the one thing you intend to do, start
          the timer, and check the list when it ends.
        </li>
        <li>
          Connect the <Link to="/guide/calendar">Calendar</Link> (this one needs a WindoM account) to see today's events
          directly under your tasks in the same sidebar.
        </li>
      </ul>

      <h2>Common questions</h2>
      <h3>Do I need an account for tasks?</h3>
      <p>No. Tasks work from the first install and are not tied to a WindoM account.</p>
      <h3>Can I edit a task after adding it?</h3>
      <p>Tasks can be added, ticked and removed. To change the wording, remove the task and add it again.</p>
      <h3>Why can't I see the sidebar?</h3>
      <p>
        The sidebar opens from the list icon in the bottom-right corner, or from the edge you chose under Tab Sidebar in
        General settings. If the list icon is there but the tasks are not, check <strong>Show in sidebar</strong> above.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Today's Tasks is missing from the sidebar.</strong> Turn <strong>Show in sidebar</strong> back on
          under Settings → Apps → Tasks.
        </li>
        <li>
          <strong>My tasks disappeared.</strong> The usual cause is <strong>Reset to Defaults</strong>, or clearing the
          browser's extension data. Tasks removed that way are not recoverable from within WindoM.
        </li>
        <li>
          <strong>A task will not add.</strong> An empty or blank entry is ignored. Type some text and press{' '}
          <kbd>Enter</kbd> or click <strong>+</strong>.
        </li>
        <li>
          Still stuck? See <Link to="/support">Support</Link>.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/focus">Focus Mode</Link> - set an intention and dim the tab
        </li>
        <li>
          <Link to="/guide/calendar">Connect Google Calendar</Link> - today's events in the same sidebar
        </li>
        <li>
          <Link to="/guide/tab-sidebar">Tab Sidebar</Link> - the sidebar's side and the tabs list
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
