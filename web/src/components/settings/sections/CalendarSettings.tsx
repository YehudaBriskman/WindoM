import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { SETTINGS_EVENT } from '../../../lib/settings-events';
import { GlassSelect } from '../../ui/GlassSelect';

/**
 * Shown inside the sidebar calendar section or any settings area.
 * Full integration management lives in Settings → Account.
 */
export function CalendarSettings() {
  const { user } = useAuth();
  const { settings, update } = useSettings();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="settings-row">
        <label className="settings-label">Look-ahead window</label>
        <GlassSelect
          value={String(settings.calendarDays)}
          onChange={(v) => update('calendarDays', Number(v) as 7 | 14 | 30)}
          options={[
            { value: '7', label: '7 days' },
            { value: '14', label: '14 days' },
            { value: '30', label: '30 days' },
          ]}
        />
      </div>

      {!user ? (
        <div className="auth-required-notice">
          <p>
            Sign in to connect Google Calendar.{' '}
            <button
              type="button"
              className="auth-required-link"
              onClick={() => document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.OPEN_ACCOUNT))}
            >
              Go to Account settings
            </button>
          </p>
        </div>
      ) : (
        <div className="auth-required-notice">
          <p>
            Manage your Google Calendar connection in{' '}
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
      )}
    </div>
  );
}
