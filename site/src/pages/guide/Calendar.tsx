import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: Google Calendar.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Calendar() {
  return (
    <DocsLayout path="/guide/calendar" eyebrow="User Guide" title="Connect Google Calendar">
      <h2>Overview</h2>

      <p>
        WindoM pulls your upcoming Google Calendar events into the sidebar so your day is always visible. This requires
        a WindoM account and a one-time Google authorization.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>Make sure you have a WindoM account and are signed in (Settings → Account tab).</p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Open Settings → <strong>Apps</strong> → click the <strong>Calendar</strong> card → click{' '}
            <strong>Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            A Google authorization window opens. Choose your Google account and click <strong>Allow</strong>.
          </p>
          <p>
            WindoM only requests read-only access to your calendar events - it cannot create, edit, or delete anything.
            The exact permissions are listed in the <Link to="/privacy">privacy policy</Link>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>Done. Your upcoming events appear in the sidebar, grouped by day.</p>
        </div>
      </div>
      <div className="callout tip">
        <strong>Look-ahead window</strong> - by default events for the next 7 days are shown. You can change this to 14
        or 30 days on the same <strong>Calendar</strong> card under Settings → Apps.
      </div>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
