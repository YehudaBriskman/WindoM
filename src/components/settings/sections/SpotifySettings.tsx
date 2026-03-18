import { useAuth } from '../../../contexts/AuthContext';
import { SETTINGS_EVENT } from '../../../lib/settings-events';

/**
 * Spotify connection settings — full management lives in Settings → Account.
 */
export function SpotifySettings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="auth-required-notice">
        <p>
          Sign in to connect Spotify.{' '}
          <button
            type="button"
            className="auth-required-link"
            onClick={() => document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.OPEN_ACCOUNT))}
          >
            Go to Account settings
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-required-notice">
      <p>
        Manage your Spotify connection in{' '}
        <button
          type="button"
          className="auth-required-link"
          onClick={() => document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.OPEN_ACCOUNT))}
        >
          Account settings
        </button>
        .
      </p>
    </div>
  );
}
