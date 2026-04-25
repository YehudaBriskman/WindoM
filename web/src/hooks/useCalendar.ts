import { useState, useEffect, useCallback, useRef } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import { apiGet, getAccessToken } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
import { CALENDAR_FETCH_DEBOUNCE_MS } from '../lib/timing-constants';
import type { CalendarEvent } from '../types/calendar';

export function useCalendar() {
  const { settings } = useSettings();
  const calendarConnected = settings.integrations.calendar.connected;
  const calendarDays = settings.integrations.calendar.days;
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load events - from backend if connected (or if a token exists, to recover
  // from a reset connected flag), otherwise from local storage.
  // calendarDays changes are debounced 500ms so rapid setting adjustments
  // don't fire multiple API calls.
  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);

    fetchTimerRef.current = setTimeout(async () => {
      // Try API if explicitly connected, or if signed in (catches cases where
      // calendarConnected got reset by backend sync while token is still valid).
      const token = calendarConnected ? 'skip-check' : await getAccessToken();
      if (!token) {
        syncStorage.get<CalendarEvent[]>('localEvents', []).then(setEvents);
        return;
      }

      apiGet<{ events: CalendarEvent[] }>(`/calendar/events?days=${calendarDays}`)
        .then((data) => setEvents(data.events))
        .catch((err) => {
          console.warn('[calendar] Fetch failed, using cached:', err);
          syncStorage.get<CalendarEvent[]>('localEvents', []).then(setEvents);
        });
    }, CALENDAR_FETCH_DEBOUNCE_MS);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [calendarConnected, calendarDays]);

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

  // Upcoming events: sorted by date, within look-ahead window, max 5
  const now = new Date();
  const lookAhead = new Date(now);
  lookAhead.setDate(lookAhead.getDate() + calendarDays);
  lookAhead.setHours(23, 59, 59, 999);

  const upcomingEvents = events
    .filter((e) => {
      const d = new Date(e.date);
      return d >= now && d <= lookAhead;
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
