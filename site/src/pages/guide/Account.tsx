import { Link } from 'react-router';
import { DocsLayout } from '../../components/DocsLayout';

/**
 * The guide page for one feature: WindoM Account.
 *
 * Split out of the single long guide so each feature has its own URL, title
 * and description to be found by. The copy is the guide's own section, moved
 * verbatim. The Hebrew page mirrors it.
 */
export function Account() {
  return (
    <DocsLayout path="/guide/account" eyebrow="User Guide" title="Create a WindoM Account">
      <p>
        A WindoM account syncs your settings across devices and is required to connect Google Calendar, Spotify or
        GitHub. Registration is free and takes under a minute.
      </p>
      <div className="step">
        <div className="step-num">1</div>
        <div className="step-body">
          <p>
            Open the gear icon (<strong>Settings</strong>) in the bottom-left corner of your new tab, then go to the{' '}
            <strong>Account</strong> tab.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">2</div>
        <div className="step-body">
          <p>
            Enter your email address and a password (minimum 8 characters) and click <strong>Create account</strong>.
          </p>
          <p>
            Or click <strong>Continue with Google</strong> if you prefer not to manage a password.
          </p>
        </div>
      </div>
      <div className="step">
        <div className="step-num">3</div>
        <div className="step-body">
          <p>Check your inbox for a verification email and click the link inside. You're signed in.</p>
        </div>
      </div>
      <div className="callout tip">
        <strong>Settings sync</strong> - once signed in, your clock format, background preference, widgets, and quick
        links all sync to the cloud and appear on any device where you're logged in to WindoM.
      </div>
      <h2>Managing your account</h2>
      <p>
        Everything below is in Settings → <strong>Account</strong> once you are signed in.
      </p>
      <ul>
        <li>
          <strong>Name</strong> - change it under <strong>Profile</strong> and click <strong>Save</strong>.
        </li>
        <li>
          <strong>Password</strong> - accounts with a password can set a new one under <strong>Change password</strong>.
          If you have forgotten it, click <strong>Forgot password?</strong> on the sign-in form and WindoM emails you a
          reset link.
        </li>
        <li>
          <strong>Active sessions</strong> - every browser signed in to your account is listed.{' '}
          <strong>Revoke session</strong> stops one from renewing; it can keep working for up to 15 minutes afterwards.
        </li>
        <li>
          <strong>Sign out</strong> - signs this browser out of the account.
        </li>
        <li>
          <strong>Delete account</strong> - under <strong>Danger Zone</strong>. It permanently deletes the account and
          everything stored with it, including your Calendar and Spotify connections. Password accounts are asked for
          the password to confirm.
        </li>
      </ul>
      <p>
        What the account stores, and what never leaves your device, is in the <Link to="/privacy">privacy policy</Link>.
      </p>
      <p>
        Back to the <Link to="/guide">User Guide</Link>
      </p>
    </DocsLayout>
  );
}
