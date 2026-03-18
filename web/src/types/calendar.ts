export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  color?: string;
  calendarId?: string;
  htmlLink?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}
