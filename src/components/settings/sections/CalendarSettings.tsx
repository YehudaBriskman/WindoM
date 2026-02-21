import { useAuth } from '../../../contexts/AuthContext';

/**
 * Shown inside the sidebar calendar section or any settings area.
 * Full integration management lives in Settings → Account.
 */
export function CalendarSettings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="auth-required-notice">
        <p>
          Sign in to connect Google Calendar.{' '}
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
        Manage your Google Calendar connection in{' '}
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
