import type { CalendarEvent } from '../../types/calendar';
import { formatEventDate } from '../../hooks/useCalendar';

export function EventItem({ event }: { event: CalendarEvent }) {
  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {event.color && (
          <span
            className="event-item-color-dot"
            style={{ background: event.color }}
          />
        )}
        <div className="event-item-title">{event.title}</div>
      </div>
      <div className="event-item-date">{formatEventDate(event.date)}</div>
    </>
  );

  if (event.htmlLink) {
    return (
      <a
        href={event.htmlLink}
        target="_blank"
        rel="noreferrer"
        className="event-item event-item-link"
      >
        {inner}
      </a>
    );
  }

  return <div className="event-item">{inner}</div>;
}
