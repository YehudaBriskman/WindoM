import { useSettings } from '../../../contexts/SettingsContext';

export function QuotesSettings() {
  const { settings, update } = useSettings();

  return (
    <div>
      <div className="settings-group">
        <label className="settings-checkbox-label">
          <input
            type="checkbox"
            checked={settings.widgets.showQuotes}
            onChange={(e) => update('widgets', { showQuotes: e.target.checked })}
          />
          Show daily quotes
        </label>
      </div>
      <p className="settings-hint">
        Quotes come from a list bundled with WindoM. Nothing about them leaves your device.
      </p>
    </div>
  );
}
