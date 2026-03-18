import { useSettings } from '../../../contexts/SettingsContext';
import { GlassSelect } from '../../ui/GlassSelect';

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
          {(['default', 'glass', 'outline'] as const).map((style) => (
            <button
              key={style}
              className={`segmented-btn${clockStyle === style ? ' active' : ''}`}
              onClick={() => update('clockStyle', style)}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
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
          {([100, 200, 400, 600] as const).map((weight) => (
            <button
              key={weight}
              className={`segmented-btn${clockWeight === weight ? ' active' : ''}`}
              onClick={() => update('clockWeight', weight)}
            >
              {weight === 100 ? 'Thin' : weight === 200 ? 'Light' : weight === 400 ? 'Regular' : 'Bold'}
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
            <GlassSelect
              value={settings.dateFormat ?? 'long'}
              onChange={(value) => update('dateFormat', value as 'long' | 'short' | 'numeric')}
              options={[
                { value: 'long', label: 'Monday, March 17' },
                { value: 'short', label: 'Mon, Mar 17' },
                { value: 'numeric', label: '03/17/2026' },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
