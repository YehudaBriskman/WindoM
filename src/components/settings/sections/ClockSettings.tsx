import { useSettings } from '../../../contexts/SettingsContext';

export function ClockSettings() {
  const { settings, update } = useSettings();

  const clockStyle = settings.clockStyle ?? 'default';
  const clockWeight = settings.clockWeight ?? 200;

  return (
    <div>
      {/* FORMAT */}
      <div className="settings-group">
        <label className="settings-label" style={{ marginBottom: 12, fontSize: 15, fontWeight: 500 }}>
          Format
        </label>

        <label className="settings-label">Time Format</label>
        <div className="segmented-control" style={{ marginBottom: 16 }}>
          <button
            className={`segmented-btn${settings.timeFormat === '12h' ? ' active' : ''}`}
            onClick={() => update('timeFormat', '12h')}
          >
            12-hour
          </button>
          <button
            className={`segmented-btn${settings.timeFormat === '24h' ? ' active' : ''}`}
            onClick={() => update('timeFormat', '24h')}
          >
            24-hour
          </button>
        </div>

        <div className="visibility-table">
          <label className="visibility-row">
            <span style={{ flex: 1, fontSize: 14 }}>Show Seconds</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showSeconds ?? false}
                onChange={(e) => update('showSeconds', e.target.checked)}
              />
              <span className="toggle-track"><span className="toggle-knob" /></span>
            </label>
          </label>
          {settings.timeFormat === '12h' && (
            <label className="visibility-row">
              <span style={{ flex: 1, fontSize: 14 }}>Leading Zero (09:05)</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.clockLeadingZero ?? false}
                  onChange={(e) => update('clockLeadingZero', e.target.checked)}
                />
                <span className="toggle-track"><span className="toggle-knob" /></span>
              </label>
            </label>
          )}
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="settings-group" style={{ marginTop: 28 }}>
        <label className="settings-label" style={{ marginBottom: 12, fontSize: 15, fontWeight: 500 }}>
          Appearance
        </label>

        <label className="settings-label">Style</label>
        <div className="segmented-control" style={{ marginBottom: 16 }}>
          {(['default', 'glass', 'outline'] as const).map((s) => (
            <button
              key={s}
              className={`segmented-btn${clockStyle === s ? ' active' : ''}`}
              onClick={() => update('clockStyle', s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <label className="settings-label">Color</label>
        <div style={{ marginBottom: 16 }}>
          <input
            type="color"
            value={settings.clockColor ?? '#ffffff'}
            onChange={(e) => update('clockColor', e.target.value)}
            className="clock-color-input"
          />
        </div>

        <label className="settings-label">
          Size — {settings.clockSize ?? 120}px
        </label>
        <input
          type="range"
          min={60}
          max={180}
          step={4}
          value={settings.clockSize ?? 120}
          onChange={(e) => update('clockSize', Number(e.target.value))}
          className="clock-size-slider"
          style={{ marginBottom: 16 }}
        />

        <label className="settings-label">Font Weight</label>
        <div className="segmented-control">
          {([100, 200, 400, 600] as const).map((w) => (
            <button
              key={w}
              className={`segmented-btn${clockWeight === w ? ' active' : ''}`}
              onClick={() => update('clockWeight', w)}
            >
              {w === 100 ? 'Thin' : w === 200 ? 'Light' : w === 400 ? 'Regular' : 'Bold'}
            </button>
          ))}
        </div>
      </div>

      {/* DATE */}
      <div className="settings-group" style={{ marginTop: 28 }}>
        <label className="settings-label" style={{ marginBottom: 12, fontSize: 15, fontWeight: 500 }}>
          Date
        </label>

        <div className="visibility-table">
          <label className="visibility-row">
            <span style={{ flex: 1, fontSize: 14 }}>Show Date</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showDate ?? false}
                onChange={(e) => update('showDate', e.target.checked)}
              />
              <span className="toggle-track"><span className="toggle-knob" /></span>
            </label>
          </label>
        </div>

        {(settings.showDate ?? false) && (
          <div style={{ marginTop: 12 }}>
            <label className="settings-label">Date Format</label>
            <select
              value={settings.dateFormat ?? 'long'}
              onChange={(e) => update('dateFormat', e.target.value as 'long' | 'short' | 'numeric')}
              className="settings-select glass-input"
            >
              <option value="long">Monday, March 17</option>
              <option value="short">Mon, Mar 17</option>
              <option value="numeric">03/17/2026</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
