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
      <h2>What an account does and does not do</h2>
      <p>
        An account is optional. The dashboard works without one, and todos, quick links, uploaded backgrounds and the
        finance watchlist stay on your device either way. The account adds three things: your settings follow you to
        other browsers, you can connect Google Calendar and GitHub, and Spotify's connection is stored with your
        account. It does not change what is kept only on your device.
      </p>
      <h2>What is stored on the server</h2>
      <p>
        The <Link to="/privacy">privacy policy</Link> is the authority here. For an account it lists:
      </p>
      <ul>
        <li>Your email address and a bcrypt-hashed password (never the password itself).</li>
        <li>Your display name.</li>
        <li>Your dashboard settings, so they stay consistent across your devices.</li>
        <li>
          Active session records. For each one WindoM stores the browser and operating system name, for example "Chrome
          · Windows" with no versions, so you can recognise it under <strong>Active sessions</strong>. It is deleted
          with the session or the account.
        </li>
        <li>
          A security log of sensitive actions such as sign-ins, failed sign-in attempts, password changes and connecting
          or disconnecting an integration. Each entry holds the action, its time, the session and the same browser and
          operating system name - never an IP address, email or token. Entries are deleted after 180 days, or
          immediately with your account.
        </li>
      </ul>
      <p>
        Service credentials - Google and Spotify tokens and the GitHub token - are encrypted at rest with AES-256-GCM.
        Sign-in uses short-lived access tokens (15 minutes) and a refresh cookie that is rotated; if a refresh token is
        reused, the session is revoked automatically.
      </p>
      <h2>Sign-in methods</h2>
      <ul>
        <li>
          <strong>Email and password</strong> - the password needs at least 8 characters. You verify the address from
          the email WindoM sends.
        </li>
        <li>
          <strong>Continue with Google</strong> - no WindoM password to manage. If you signed up this way and need to
          sign in again, use the same button.
        </li>
      </ul>
      <h2>Deleting your account and your data</h2>
      <ol>
        <li>
          Open Settings → <strong>Account</strong> → <strong>Danger Zone</strong> → <strong>Delete account</strong>.
        </li>
        <li>If your account has a password, enter it to confirm.</li>
      </ol>
      <p>
        Your data is deleted from the database immediately, including the stored Calendar, Spotify and GitHub
        connections and the security log. Copies that can remain in server logs and database backups are not used for
        anything and expire on their own within 30 days. Things kept only in your browser are not touched by this; they
        remain until you clear them or uninstall the extension.
      </p>
      <div className="callout warn">
        <strong>Deletion cannot be undone.</strong> If you only want one service gone, disconnect it from Settings →{' '}
        <strong>Apps</strong> instead: that removes its stored token and leaves the account intact.
      </div>
      <p>
        You can also download a JSON copy of your server-side data from the authenticated <code>GET /me/export</code>{' '}
        endpoint. Passwords, tokens and API keys are left out of it.
      </p>
      <h2>Common questions</h2>
      <h3>Do I need an account to use WindoM?</h3>
      <p>
        No. You need one only for Calendar, GitHub and settings sync through WindoM. Without an account, Chrome's own
        profile sync can carry your settings between machines signed in to the same Chrome account.
      </p>
      <h3>What does not sync?</h3>
      <p>
        Background images, cached weather and tab history are deliberately excluded. They are large and stay on the
        device that made them.
      </p>
      <h3>Why did I not receive the verification or reset email?</h3>
      <p>
        Check your spam folder first. If it has not arrived, write to us from <Link to="/contact">Contact</Link>.
      </p>
      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>"You've reached the maximum number of active sessions"</strong> - sign out on a browser you no longer
          use, or open <strong>Active sessions</strong> from one that is still signed in and click{' '}
          <strong>Revoke session</strong>. A revoked session can keep working for up to 15 minutes.
        </li>
        <li>
          <strong>Settings did not appear on another computer</strong> - make sure you are signed in on both machines
          under Settings → Account.
        </li>
        <li>
          <strong>Forgotten password</strong> - use <strong>Forgot password?</strong>, then{' '}
          <strong>Send reset link</strong>.
        </li>
      </ul>
      <p>
        More fixes are on the <Link to="/support">Support</Link> page.
      </p>
      <h2>Related pages</h2>
      <ul>
        <li>
          <Link to="/guide/calendar">Connect Google Calendar</Link>
        </li>
        <li>
          <Link to="/guide/github">Connect GitHub</Link>
        </li>
        <li>
          <Link to="/guide/spotify">Connect Spotify</Link>
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
