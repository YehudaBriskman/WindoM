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
      <h2>What the Calendar widget does and does not do</h2>
      <p>
        The widget lists your upcoming events in the sidebar, grouped by day. WindoM reads events from the calendars on
        your Google account (not only the primary one) for the look-ahead window you chose, and shows each event's
        title, time and calendar name. It is read-only: you cannot create, edit, accept or delete events from WindoM.
      </p>
      <h2>Exactly what Google is asked for</h2>
      <p>
        The consent screen requests four scopes in a single OAuth consent, and the{' '}
        <Link to="/privacy">privacy policy</Link> states that this is the complete list:
      </p>
      <ul>
        <li>
          <code>calendar.readonly</code> - read access to your calendars and events. This is what the widget needs.
        </li>
        <li>
          <code>openid</code>, <code>email</code> and <code>profile</code> - identify which Google account you are
          connecting.
        </li>
      </ul>
      <p>
        No Gmail scope is requested. The Gmail widget is switched off on the hosted service, so mail permission never
        appears on the consent screen.
      </p>
      <h2>What is stored, and for how long</h2>
      <ul>
        <li>
          Your Google access token is stored encrypted on WindoM's server with AES-256-GCM and is used only to request
          your events on your behalf. It is not shared with third parties.
        </li>
        <li>
          Event details are fetched when needed and shown on your dashboard. Per the privacy policy, WindoM does not
          read event descriptions or attendees.
        </li>
        <li>Your look-ahead choice is part of your synced settings.</li>
      </ul>
      <p>
        Google user data is never sold, never used for advertising and never used to train a model. WindoM's use of
        information from Google APIs follows the Google API Services User Data Policy, including its Limited Use
        requirements.
      </p>
      <h2>Settings explained</h2>
      <p>
        The <strong>Calendar</strong> card under Settings → <strong>Apps</strong> has one adjustable value, the
        look-ahead window: 7 days by default, or 14 or 30 days. The server accepts at most 30 days. It also fetches at
        most 50 events per calendar, so on a very busy calendar a long window may not show everything.
      </p>
      <h2>Disconnecting</h2>
      <ol>
        <li>
          Open Settings → <strong>Apps</strong> and the <strong>Calendar</strong> card.
        </li>
        <li>
          Click <strong>Disconnect</strong>. WindoM immediately revokes its stored token and deletes cached data.
        </li>
      </ol>
      <p>
        Deleting your WindoM account removes the connection too. To check or remove WindoM's access from Google's side,
        use the third-party access list in your Google Account settings.
      </p>
      <h2>Common questions</h2>
      <h3>Can WindoM change my calendar?</h3>
      <p>
        No. It asks only for <code>calendar.readonly</code>, which Google does not allow to create, edit or delete
        anything.
      </p>
      <h3>Do I need a WindoM account?</h3>
      <p>
        Yes. The Google token is stored against your account. See{' '}
        <Link to="/guide/account">Create a WindoM Account</Link>.
      </p>
      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>A "this app isn't verified" screen</strong> - Google shows this for any app whose verification is not
          complete, and it is safe to continue past it. Whatever it says, WindoM only asks to read your calendar.
        </li>
        <li>
          <strong>Calendar keeps disconnecting</strong> - if you connected before 26 October 2026 and were disconnected
          about a week later, that was a configuration fault on our side: Google expires access after seven days while
          an app's consent screen is in testing. It was published on 26 October 2026. Reconnect once from Settings →
          Apps → Calendar → <strong>Connect</strong> and it should hold.
        </li>
        <li>
          <strong>"Could not refresh Google token. Please reconnect."</strong> - the stored Google access can no longer
          be renewed. Reconnect from the same card.
        </li>
        <li>
          <strong>Signed out right after signing in</strong> - fixed in version 1.5.1. Check your version at{' '}
          <code>chrome://extensions</code>.
        </li>
      </ul>
      <p>
        More fixes are on the <Link to="/support">Support</Link> page.
      </p>
      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/account">Create a WindoM Account</Link>
        </li>
        <li>
          <Link to="/guide/spotify">Connect Spotify</Link>
        </li>
        <li>
          <Link to="/guide/templates">Layout Templates</Link>
        </li>
        <li>
          <Link to="/privacy">Privacy policy</Link> and <Link to="/support">Support</Link>
        </li>
        <li>
          <Link to="/local-setup">Run your own server</Link>
        </li>
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
