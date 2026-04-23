import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatClock } from '../utils/time';
import { CLOCK_UPDATE_INTERVAL_MS } from '../lib/timing-constants';

export function useClock() {
  const { settings } = useSettings();
  const use24h = settings.clock.timeFormat === '24h';
  const showSeconds = settings.clock.showSeconds;
  const leadingZero = settings.clock.leadingZero;

  const [clock, setClock] = useState(() => formatClock(new Date(), use24h, showSeconds, leadingZero));

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date(), use24h, showSeconds, leadingZero));
    tick();
    const id = setInterval(tick, CLOCK_UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [use24h, showSeconds, leadingZero]);

  return clock;
}
