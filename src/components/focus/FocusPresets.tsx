import { useFocusTimer } from '../../contexts/FocusTimerContext';
import { useSettings } from '../../contexts/SettingsContext';

const PRESETS = [
  { label: '25m', minutes: 25 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
];

export function FocusPresets() {
  const { settings } = useSettings();
  const { phase, start } = useFocusTimer();

  if (!settings.showFocus) return null;
  if (phase !== 'idle') return null;

  return (
    <div className="focus-presets">
      {PRESETS.map((p) => (
        <button
          key={p.minutes}
          onClick={() => start(p.minutes)}
          className="focus-preset-btn"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
