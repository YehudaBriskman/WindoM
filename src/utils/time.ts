/** Get time-of-day greeting string */
export function getGreeting(): string {
  const hours = new Date().getHours();
  if (hours >= 5 && hours < 12) return 'Good morning';
  if (hours >= 12 && hours < 17) return 'Good afternoon';
  if (hours >= 17 && hours < 21) return 'Good evening';
  return 'Good night';
}

/** Format a Date for clock display */
export function formatClock(date: Date, use24h: boolean): { time: string; ampm?: string } {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (use24h) {
    return { time: `${String(hours).padStart(2, '0')}:${minutes}` };
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return { time: `${h12}:${minutes}`, ampm };
}
