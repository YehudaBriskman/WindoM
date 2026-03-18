import { useState, useEffect } from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import { EventItem } from './EventItem';

export function CalendarSection() {
  const { upcomingEvents } = useCalendar();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      setDateStr(
        new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h3 className="calendar-title">Calendar</h3>
      <div className="calendar-date">
        {dateStr}
      </div>
      <div>
        <h4 className="calendar-upcoming-title">Upcoming</h4>
        <div className="calendar-upcoming">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => <EventItem key={event.id} event={event} />)
          ) : (
            <div className="calendar-empty">No upcoming events</div>
          )}
        </div>
      </div>
    </div>
  );
}
