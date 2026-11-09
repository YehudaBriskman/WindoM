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
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
