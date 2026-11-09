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
      <h2>How it works</h2>
      <p>
        Focus Mode has two parts that work independently: the <strong>focus field</strong>, where you write what you
        want to get done, and the <strong>countdown</strong>, which clears the page for a fixed length of time. You can
        use the field without ever starting a timer, and you can start a timer without writing anything.
      </p>
      <p>When you click a duration, the page changes in stages rather than all at once:</p>
      <ol>
        <li>The widgets fade out and the background image slowly zooms in.</li>
        <li>
          A full-screen overlay fades in. It shows the clock, the time remaining as <code>HH:MM:SS</code>, and a{' '}
          <strong>Stop Focus</strong> button.
        </li>
        <li>
          The countdown ticks down once a second. When it reaches zero, Focus Mode ends on its own and the page fades
          back in.
        </li>
      </ol>
      <p>
        Stopping early, by any of the three ways above, plays the same sequence in reverse. The whole transition takes
        about three seconds each way, and the duration buttons are hidden while Focus Mode is running.
      </p>

      <h2>Writing and editing your focus</h2>
      <ul>
        <li>
          <strong>Save</strong> - press <kbd>Enter</kbd> or click away from the field. The text is trimmed, so leading
          and trailing spaces are dropped.
        </li>
        <li>
          <strong>Mark done</strong> - click the text once. It is crossed out and dimmed; click again to undo.
        </li>
        <li>
          <strong>Edit</strong> - double-click the text, change it, and press <kbd>Enter</kbd> or click away.
        </li>
        <li>
          <strong>Start fresh</strong> - when you save text that differs from the previous focus, the done mark is
          cleared, so a new focus never starts out crossed out.
        </li>
        <li>
          <strong>Clear it</strong> - delete all the text and save. The field goes back to asking{' '}
          <em>What is your main focus for today?</em>
        </li>
      </ul>
      <p>A small save indicator beside the field shows the result of each save.</p>

      <h2>The durations and the settings that affect them</h2>
      <p>
        The four durations are fixed: <strong>25m</strong> (25 minutes), <strong>1h</strong> (60 minutes),{' '}
        <strong>2h</strong> (120 minutes) and <strong>4h</strong> (240 minutes). There is no custom length.
      </p>
      <p>
        The only setting is <strong>Center Bar</strong> under Settings → General → Widget Visibility. It is on by
        default. Turning it off hides the focus field and the duration buttons together; it does not change what you
        wrote, which is still there when you turn it back on.
      </p>

      <h2>Where your data is stored</h2>
      <ul>
        <li>
          The focus text and its done mark are stored on this device only, in the browser's local extension storage.
          They are deliberately left out of settings sync, so they do not follow you to another computer and are not
          sent to the WindoM server.
        </li>
        <li>
          The countdown is not saved anywhere. It exists only in the open new tab, so closing or reloading that tab ends
          it.
        </li>
        <li>Focus Mode makes no network requests of its own.</li>
      </ul>
      <p>
        See the <Link to="/privacy">Privacy Policy</Link> for the full picture of what the extension stores and sends.
      </p>

      <h2>Tips and good setups</h2>
      <ul>
        <li>
          Write the focus as one concrete outcome, then pick a duration that fits it. The field is a single line, so it
          suits a short sentence.
        </li>
        <li>
          Use <strong>25m</strong> for a single sitting and <strong>4h</strong> for a long block. If you finish early,{' '}
          <kbd>Escape</kbd> ends it.
        </li>
        <li>
          Pair it with a quiet layout. A <Link to="/guide/templates">template</Link> can hide the widgets you do not
          need, and <Link to="/guide/background">Background</Link> controls the image that zooms in behind the clock.
        </li>
        <li>
          Keep your list of smaller jobs in <Link to="/guide/todos">Tasks</Link> and use the focus field for the one
          thing that matters today.
        </li>
      </ul>

      <h2>Common questions</h2>
      <p>
        <strong>Does Focus Mode block other websites?</strong> No. It clears the new tab page you are looking at; it
        does not block sites, close tabs or silence notifications.
      </p>
      <p>
        <strong>Is there a sound or notification when time is up?</strong> No. When the countdown ends, the overlay
        simply fades out and the page returns.
      </p>
      <p>
        <strong>Can I pause the countdown?</strong> No. You can stop it and start a new one.
      </p>
      <p>
        <strong>Can I set my own length?</strong> No. Only the four durations above are offered.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>The focus field and durations are missing</strong> - Center Bar is off. Turn it on in Settings →
          General → Widget Visibility.
        </li>
        <li>
          <strong>Escape does nothing</strong> - it works while Focus Mode is starting or running, but not during the
          fade-out that follows stopping. Wait a moment for the page to return.
        </li>
        <li>
          <strong>My text did not save</strong> - watch the save indicator beside the field. If it reports a problem,
          edit the text again and press <kbd>Enter</kbd>.
        </li>
        <li>
          <strong>My focus is crossed out</strong> - you clicked it, which marks it done. Click it once more to undo.
        </li>
      </ul>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/todos">Tasks</Link> - a list for everything that is not today's one thing
        </li>
        <li>
          <Link to="/guide/templates">Templates</Link> - one-click layouts that show or hide widgets
        </li>
        <li>
          <Link to="/guide/shortcuts">Keyboard Shortcuts</Link> - every key the extension responds to
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
