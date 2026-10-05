export type CalendarEventType = "class" | "session" | "quiz" | "assignment";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date | string;
  type: CalendarEventType;
  description?: string;
  location?: string;
}
