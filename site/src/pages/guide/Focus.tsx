import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Focus Mode.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Focus() {
  return (
    <DocsLayout path="/guide/focus" eyebrow="User Guide" title="Focus Mode">
      <h2>Overview</h2>

      <p>
        The center of the new tab asks <em>What is your main focus for today?</em> Write it down, and when it is time to
        work on it, start a countdown that hides everything else.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Type your focus into the field in the center and press <strong>Enter</strong>. Click it later to mark it
            done; double-click it to edit it.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Click one of the durations below it - <strong>25m</strong>, <strong>1h</strong>, <strong>2h</strong> or{' '}
            <strong>4h</strong>. The rest of the page fades away, leaving the clock and the time remaining.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            To stop early, click <strong>Stop Focus</strong>, click anywhere on the screen, or press{' '}
            <strong>Escape</strong>.
          </p>
        </div>
      </div>
      <div className="callout tip">
        <strong>Not using it?</strong> - turn off <strong>Center Bar</strong> under Settings → General → Widget
        Visibility to hide the focus field and the durations.
      </div>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
