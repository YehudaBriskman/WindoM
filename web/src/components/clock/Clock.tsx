import type { CSSProperties } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useClock } from '../../hooks/useClock';
import { formatDate } from '../../utils/time';

export function Clock({ id }: { id?: string }) {
  const { settings } = useSettings();
  const { time, ampm } = useClock();

  const style = settings.clock.style;
  const color = settings.clock.color;

  const inlineStyle = {
    fontSize: `${settings.clock.size}px`,
    fontWeight: settings.clock.weight,
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

  const dateStr = settings.clock.showDate ? formatDate(new Date(), settings.clock.dateFormat) : null;

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
