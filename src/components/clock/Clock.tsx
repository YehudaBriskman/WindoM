import type { CSSProperties } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useClock } from '../../hooks/useClock';
import { formatDate } from '../../utils/time';

export function Clock({ id }: { id?: string }) {
  const { settings } = useSettings();
  const { time, ampm } = useClock();

  const style = settings.clockStyle ?? 'default';
  const color = settings.clockColor ?? '#ffffff';

  const inlineStyle = {
    fontSize: `${settings.clockSize ?? 120}px`,
    fontWeight: settings.clockWeight ?? 200,
    ...(style === 'outline'
      ? { color: 'transparent', WebkitTextStroke: `2px ${color}` }
      : style === 'glass'
      ? { color: 'transparent', '--glass-tint': color }
      : { color }),
  } as CSSProperties;

  const className = [
    'clock',
    style === 'default' ? 'text-shadow-md' : '',
    style === 'glass' ? 'text-liquid-glass' : '',
    style === 'outline' ? 'clock-outline' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const dateStr = settings.showDate ? formatDate(new Date(), settings.dateFormat ?? 'long') : null;

  return (
    <>
      <div id={id} className={className} style={inlineStyle}>
        {time}
        {ampm && <span className="clock-ampm">{ampm}</span>}
      </div>
      {dateStr && <div className="clock-date">{dateStr}</div>}
    </>
  );
}
