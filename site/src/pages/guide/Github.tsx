import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: GitHub.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Github() {
  return (
    <DocsLayout path="/guide/github" eyebrow="User Guide" title="Connect GitHub">
      <h2>Overview</h2>

      <p>
        The GitHub widget puts three numbers in the sidebar: unread notifications, pull requests waiting on your review,
        and open issues assigned to you. Each row links straight to the matching page on GitHub. It needs a WindoM
        account and a personal access token you create yourself.
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
            Go to{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=notifications,repo&description=WindoM"
              target="_blank"
              rel="noreferrer"
            >
              github.com/settings/tokens/new
            </a>
            . The link preselects the two scopes WindoM needs - <code>notifications</code> and <code>repo</code> - so
            check they are ticked, set an expiry you are happy with, and click <strong>Generate token</strong>.
          </p>
          <p>
            Copy the token straight away. It starts with <code>ghp_</code> and GitHub shows it only once.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>
            Open Settings → <strong>Apps</strong> → click the <strong>GitHub</strong> card. Paste the token into{' '}
            <strong>Personal Access Token</strong> and click <strong>Connect</strong>.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">4</div>
        <div className="step-body">
          <p>
            The counts appear in the sidebar and refresh on their own. <strong>Show GitHub in sidebar</strong> on the
            same card hides the widget without disconnecting.
          </p>
        </div>
      </div>
      <div className="callout warning">
        <strong>Why the repo scope?</strong> The review-request and assigned-issue counts come from GitHub's search API,
        which only includes private repositories for a token that carries <code>repo</code>. On a classic token that
        scope also grants write access, which WindoM never uses - so treat the token like a password, and revoke it from{' '}
        <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
          your token settings
        </a>{' '}
        if you stop using the widget.
      </div>
      <h2>What the GitHub widget does and does not do</h2>
      <p>
        The widget shows three counts and nothing else: unread notifications, open pull requests waiting on your review,
        and open issues assigned to you. It does not show titles, repository names or contents, and it cannot be used to
        open, comment on or change anything from WindoM.
      </p>
      <h2>The scopes, and why both are needed</h2>
      <p>
        WindoM uses a <strong>classic personal access token</strong> with two scopes:
      </p>
      <ul>
        <li>
          <code>notifications</code> - lets WindoM count your unread notifications.
        </li>
        <li>
          <code>repo</code> - needed so the review-request and assigned-issue searches include private repositories.
        </li>
      </ul>
      <p>
        The <code>repo</code> scope is broad. On a classic token it covers read and write access to the repositories you
        can reach. WindoM only ever makes three read requests, but the token itself carries everything GitHub granted
        it, so keep it as secret as a password.
      </p>
      <h2>How it works and what is stored</h2>
      <ul>
        <li>
          The token is sent to WindoM's server over HTTPS and stored encrypted at rest with AES-256-GCM, together with
          your GitHub username.
        </li>
        <li>
          WindoM's server, not your browser, calls <code>api.github.com</code> with it and returns only the three
          numbers and your username to the extension.
        </li>
        <li>
          Nothing about the notifications, pull requests or issues is stored: no titles, no repository names, no
          contents.
        </li>
        <li>
          The counts are held in the server's memory for one minute to stay within GitHub's rate limits, and are never
          written to disk. The widget polls about once a minute.
        </li>
      </ul>
      <h2>Settings explained</h2>
      <ul>
        <li>
          <strong>Personal Access Token</strong> - where you paste the token before clicking <strong>Connect</strong>.
        </li>
        <li>
          <strong>Show GitHub in sidebar</strong> - hides or shows the widget. Hiding it does not disconnect or delete
          the stored token.
        </li>
        <li>
          <strong>Disconnect</strong> - deletes the stored token from WindoM's database immediately.
        </li>
      </ul>
      <h2>Disconnecting and revoking</h2>
      <ol>
        <li>
          Open Settings → <strong>Apps</strong> → the <strong>GitHub</strong> card and click <strong>Disconnect</strong>
          .
        </li>
        <li>
          Also revoke the token on GitHub, at{' '}
          <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
            github.com/settings/tokens
          </a>
          , so it stops working everywhere.
        </li>
      </ol>
      <div className="callout tip">
        <strong>Choose a short expiry.</strong> When you create the token you pick its lifetime. A token that expires on
        its own limits the damage if it ever leaks. When it expires, create a new one and reconnect.
      </div>
      <p>
        Deleting your WindoM account also deletes the stored token. See{' '}
        <Link to="/guide/account">Create a WindoM Account</Link>.
      </p>
      <h2>Common questions</h2>
      <h3>Can I use a fine-grained token?</h3>
      <p>
        The documented setup is a classic token with <code>notifications</code> and <code>repo</code>. Other token types
        are not covered here.
      </p>
      <h3>Does WindoM store my token in the browser?</h3>
      <p>
        The token goes to WindoM's server and is stored there, encrypted. Because GitHub is called by the server, an
        account is required.
      </p>
      <h3>Can I run this without trusting the hosted server?</h3>
      <p>
        Yes. WindoM is open source and you can run your own backend; see{' '}
        <Link to="/local-setup">Run your own server</Link>.
      </p>
      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>The token is rejected</strong> - WindoM treats a 401 or 403 from GitHub as an invalid token. Check
          that you copied all of it, that it has not expired or been revoked, and that both scopes are ticked. Generate
          a new one if in doubt.
        </li>
        <li>
          <strong>The numbers look a little behind</strong> - counts are cached for one minute on the server.
        </li>
        <li>
          <strong>Signed out right after signing in</strong> - fixed in version 1.5.1; check your version at{' '}
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
          <Link to="/guide/calendar">Connect Google Calendar</Link>
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
      </ul>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
