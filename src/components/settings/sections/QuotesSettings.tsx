import { useSettings } from '../../../contexts/SettingsContext';
import { GlassSelect } from '../../ui/GlassSelect';

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
        <GlassSelect
          value={settings.quoteSource}
          onChange={(value) => update('quoteSource', value as 'local' | 'api')}
          options={[
            { value: 'local', label: 'Local Quotes' },
            { value: 'api', label: 'API Quotes' },
          ]}
        />
      </div>
    </div>
  );
}
