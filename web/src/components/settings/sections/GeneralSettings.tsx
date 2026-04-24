import { Cloud, Quote, Link2, Target, User, PanelRight, PanelLeft } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  onReset: () => void;
}

export function GeneralSettings({ onReset }: Props) {
  const { settings, update } = useSettings();
  const { user } = useAuth();

  const widgets: { label: string; Icon: React.ElementType; checked: boolean; onChange: (v: boolean) => void }[] = [
    {
      label: 'Weather',
      Icon: Cloud,
      checked: settings.weather.show,
      onChange: (v) => { void update('weather', { show: v }); },
    },
    {
      label: 'Quotes',
      Icon: Quote,
      checked: settings.widgets.showQuotes,
      onChange: (v) => { void update('widgets', { showQuotes: v }); },
    },
    {
      label: 'Quick Links',
      Icon: Link2,
      checked: settings.widgets.showLinks,
      onChange: (v) => { void update('widgets', { showLinks: v }); },
    },
    {
      label: 'Center Bar',
      Icon: Target,
      checked: settings.widgets.showFocus,
      onChange: (v) => { void update('widgets', { showFocus: v }); },
    },
    {
      label: 'Greeting',
      Icon: User,
      checked: settings.general.showGreeting,
      onChange: (v) => { void update('general', { showGreeting: v }); },
    },
  ];

  return (
    <div>
      {!user && (
        <div className="settings-group">
          <label className="settings-label">Your Name:</label>
          <input
            type="text"
            value={settings.general.userName}
            placeholder="Friend"
            onChange={(e) => update('general', { userName: e.target.value || 'Friend' })}
            className="settings-input glass-input"
          />
        </div>
      )}

      <div className="settings-group">
        <label className="settings-section-heading settings-label">
          Widget Visibility
        </label>
        <div className="visibility-table">
          {widgets.map(({ label, Icon, checked, onChange }) => (
            <label key={label} className="visibility-row">
              <span className="visibility-row-icon">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="visibility-row-label">{label}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                />
                <span className="toggle-track"><span className="toggle-knob" /></span>
              </label>
            </label>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-section-heading settings-label">
          Tab Sidebar
        </label>
        <div className="segmented-control">
          <button
            className={`segmented-btn${settings.general.sidebarSide === 'left' ? ' active' : ''}`}
            onClick={() => update('general', { sidebarSide: 'left' })}
          >
            <PanelLeft size={14} strokeWidth={1.8} />
            Left
          </button>
          <button
            className={`segmented-btn${settings.general.sidebarSide === 'right' ? ' active' : ''}`}
            onClick={() => update('general', { sidebarSide: 'right' })}
          >
            <PanelRight size={14} strokeWidth={1.8} />
            Right
          </button>
        </div>
        <span className="settings-hint">Hover within 15px of the chosen edge to reveal tabs</span>
      </div>

      <div className="settings-group">
        <button onClick={onReset} className="settings-reset-btn" style={{ width: '100%' }}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
