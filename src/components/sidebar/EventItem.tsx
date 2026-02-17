import type { CalendarEvent } from '../../types/calendar';
import { formatEventDate } from '../../hooks/useCalendar';

export function EventItem({ event }: { event: CalendarEvent }) {
  return (
    <div className="event-item">
      <div className="event-item-title">{event.title}</div>
      <div className="event-item-date">{formatEventDate(event.date)}</div>
    </div>
  );
}
