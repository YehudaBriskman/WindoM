import { useSettings } from '../../../contexts/SettingsContext';

export function QuotesSettings() {
  const { settings, update } = useSettings();

  return (
    <div>
      <div className="settings-group">
        <label className="settings-checkbox-label">
          <input
            type="checkbox"
            checked={settings.quotesEnabled}
            onChange={(e) => update('quotesEnabled', e.target.checked)}
          />
          Show daily quotes
        </label>
      </div>
      <div className="settings-group">
        <label className="settings-label">Quote Source:</label>
        <select
          value={settings.quoteSource}
          onChange={(e) => update('quoteSource', e.target.value as 'local' | 'api')}
          className="settings-select glass-input"
        >
          <option value="local">Local Quotes</option>
          <option value="api">API Quotes</option>
        </select>
      </div>
    </div>
  );
}
