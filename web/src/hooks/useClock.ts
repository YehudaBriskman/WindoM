import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatClock } from '../utils/time';

export function useClock() {
  const { settings } = useSettings();
  const use24h = settings.timeFormat === '24h';
  const showSeconds = settings.showSeconds ?? false;
  const leadingZero = settings.clockLeadingZero ?? false;

  const [clock, setClock] = useState(() => formatClock(new Date(), use24h, showSeconds, leadingZero));

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date(), use24h, showSeconds, leadingZero));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [use24h, showSeconds, leadingZero]);

  return clock;
}
