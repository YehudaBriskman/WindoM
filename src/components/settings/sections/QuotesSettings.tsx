import { useSettings } from '../../../contexts/SettingsContext';

interface Props {
  formRef: React.MutableRefObject<Record<string, string | boolean>>;
}

export function QuotesSettings({ formRef }: Props) {
  const { settings } = useSettings();

  return (
    <div>
      <div className="settings-group">
        <label className="settings-checkbox-label">
          <input
            type="checkbox"
            defaultChecked={settings.quotesEnabled}
            onChange={(e) => (formRef.current.quotesEnabled = e.target.checked)}
          />
          Show daily quotes
        </label>
      </div>
      <div className="settings-group">
        <label className="settings-label">Quote Source:</label>
        <select
          defaultValue={settings.quoteSource}
          onChange={(e) => (formRef.current.quoteSource = e.target.value)}
          className="settings-select glass-input"
        >
          <option value="local">Local Quotes</option>
          <option value="api">API Quotes</option>
        </select>
      </div>
    </div>
  );
}
