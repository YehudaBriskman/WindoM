import { useState, useEffect, useCallback } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { apiGet } from '../lib/api';
import type { CalendarEvent } from '../types/calendar';

function useIsCalendarConnected(): boolean {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    syncStorage.get<boolean>('calendarConnected', false).then(setConnected);
    return syncStorage.onChange((changes) => {
      if (changes.calendarConnected) setConnected(changes.calendarConnected.newValue as boolean);
    });
  }, []);
  return connected;
}

export function useCalendar() {
  const calendarConnected = useIsCalendarConnected();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Load events — from backend if connected, otherwise from local storage
  useEffect(() => {
    if (calendarConnected) {
      apiGet<{ events: CalendarEvent[] }>('/calendar/events?days=7')
        .then((data) => setEvents(data.events))
        .catch(() => {
          // Fall back to local events on error
          syncStorage.get<CalendarEvent[]>('localEvents', []).then(setEvents);
        });
    } else {
      syncStorage.get<CalendarEvent[]>('localEvents', []).then(setEvents);
    }
  }, [calendarConnected]);

  // Cross-tab sync for local events
  useEffect(() => {
    if (calendarConnected) return;
    const unsub = syncStorage.onChange((changes) => {
      if (changes.localEvents) setEvents(changes.localEvents.newValue as CalendarEvent[]);
    });
    return unsub;
  }, [calendarConnected]);

  const save = useCallback(async (next: CalendarEvent[]) => {
    setEvents(next);
    await syncStorage.set('localEvents', next);
  }, []);

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, 'id'>) => {
      const newEvent: CalendarEvent = {
        ...event,
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      };
      save([...events, newEvent]);
    },
    [events, save],
  );

  const removeEvent = useCallback(
    (id: string) => save(events.filter((e) => e.id !== id)),
    [events, save],
  );

  // Upcoming events: next 7 days, sorted, max 5
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  const upcomingEvents = events
    .filter((e) => {
      const d = new Date(e.date);
      return d >= now && d <= nextWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return { events, upcomingEvents, addEvent, removeEvent };
}

/** Format event date for display */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

  if (dateOnly.getTime() === nowOnly.getTime()) {
    return `Today at ${date.toLocaleTimeString('en-US', timeOpts)}`;
  }

  const tomorrow = new Date(nowOnly);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return `Tomorrow at ${date.toLocaleTimeString('en-US', timeOpts)}`;
  }

  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${dateStr} at ${date.toLocaleTimeString('en-US', timeOpts)}`;
}
