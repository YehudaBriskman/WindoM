import { useFocusTimer } from '../../contexts/FocusTimerContext';

const PRESETS = [
  { label: '25m', minutes: 25 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
];

export function FocusPresets() {
  const { start } = useFocusTimer();

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
