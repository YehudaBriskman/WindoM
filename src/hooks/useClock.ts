import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatClock } from '../utils/time';

export function useClock() {
  const { settings } = useSettings();
  const use24h = settings.timeFormat === '24h';
  const [clock, setClock] = useState(() => formatClock(new Date(), use24h));

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date(), use24h));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [use24h]);

  return clock;
}
