import { Cloud, Quote, Link2, Target, User, Search } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import type { Settings } from '../../../types';

interface Props {
  onReset: () => void;
}

export function GeneralSettings({ onReset }: Props) {
  const { settings, update } = useSettings();

  const widgets: { key: 'showWeather' | 'quotesEnabled' | 'showLinks' | 'showFocus' | 'showGreeting'; label: string; Icon: React.ElementType }[] = [
    { key: 'showWeather', label: 'Weather', Icon: Cloud },
    { key: 'quotesEnabled', label: 'Quotes', Icon: Quote },
    { key: 'showLinks', label: 'Quick Links', Icon: Link2 },
    { key: 'showFocus', label: 'Center Bar', Icon: Target },
    { key: 'showGreeting', label: 'Greeting', Icon: User },
  ];

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Your Name:</label>
        <input
          type="text"
          defaultValue={settings.userName}
          placeholder="Friend"
          onChange={(e) => update('userName', e.target.value || 'Friend')}
          className="settings-input glass-input"
        />
      </div>

      <div className="settings-group" style={{ marginTop: 28 }}>
        <label className="settings-label" style={{ marginBottom: 12, fontSize: 15, fontWeight: 500 }}>
          Widget Visibility
        </label>
        <div className="visibility-table">
          {widgets.map(({ key, label, Icon }) => (
            <label key={key} className="visibility-row">
              <span className="visibility-row-icon">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => update(key, e.target.checked)}
                />
                <span className="toggle-track"><span className="toggle-knob" /></span>
              </label>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-group" style={{ marginTop: 28 }}>
        <label className="settings-label" style={{ marginBottom: 12, fontSize: 15, fontWeight: 500 }}>
          Center Bar Mode
        </label>
        <div className="segmented-control">
          <button
            className={`segmented-btn${settings.centerInputMode === 'focus' ? ' active' : ''}`}
            onClick={() => update('centerInputMode', 'focus')}
          >
            <Target size={14} strokeWidth={1.8} />
            Focus
          </button>
          <button
            className={`segmented-btn${settings.centerInputMode === 'search' ? ' active' : ''}`}
            onClick={() => update('centerInputMode', 'search')}
          >
            <Search size={14} strokeWidth={1.8} />
            Search Bar
          </button>
        </div>

        {settings.centerInputMode === 'search' && (
          <div style={{ marginTop: 12 }}>
            <label className="settings-label">Search Engine:</label>
            <select
              className="settings-select"
              value={settings.searchEngine}
              onChange={(e) => update('searchEngine', e.target.value as Settings['searchEngine'])}
            >
              <option value="google">Google</option>
              <option value="bing">Bing</option>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="brave">Brave Search</option>
            </select>
          </div>
        )}
      </div>

      <div className="settings-group" style={{ marginTop: 28 }}>
        <button onClick={onReset} className="settings-reset-btn" style={{ width: '100%' }}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
