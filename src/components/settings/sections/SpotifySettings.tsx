import { useAuth } from '../../../contexts/AuthContext';

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
            onClick={() => document.dispatchEvent(new CustomEvent('open-settings-account'))}
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
          onClick={() => document.dispatchEvent(new CustomEvent('open-settings-account'))}
        >
          Account settings
        </button>
        .
      </p>
    </div>
  );
}
