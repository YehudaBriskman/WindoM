/** Get time-of-day greeting string */
export function getGreeting(): string {
  const hours = new Date().getHours();
  if (hours >= 5 && hours < 12) return 'Good morning';
  if (hours >= 12 && hours < 17) return 'Good afternoon';
  if (hours >= 17 && hours < 21) return 'Good evening';
  return 'Good night';
}

/** Format a Date for clock display */
export function formatClock(
  date: Date,
  use24h: boolean,
  showSeconds = false,
  leadingZero = false,
): { time: string; ampm?: string } {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = showSeconds ? `:${String(date.getSeconds()).padStart(2, '0')}` : '';

  if (use24h) {
    return { time: `${String(hours).padStart(2, '0')}:${minutes}${seconds}` };
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const h12str = leadingZero ? String(h12).padStart(2, '0') : String(h12);
  return { time: `${h12str}:${minutes}${seconds}`, ampm };
}

/** Format a Date for date display below the clock */
export function formatDate(date: Date, format: 'long' | 'short' | 'numeric'): string {
  if (format === 'numeric') {
    return date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric' });
  }
  if (format === 'short') {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
