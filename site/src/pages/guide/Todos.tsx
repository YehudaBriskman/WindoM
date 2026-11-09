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
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
