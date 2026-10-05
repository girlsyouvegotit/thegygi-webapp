import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CalendarDays, Video, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CalendarView from "@/components/calendar/CalendarView";
import EventModal from "@/components/calendar/EventModal";
import type { CalendarEvent } from "@/types/calendar";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

const Calendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, sessionsRes] = await Promise.all([
        api.get("/classes"),
        api.get("/mentorship/sessions/my"),
      ]);

      const classEvents: CalendarEvent[] = (
        classesRes.data.data.classes || []
      ).map(
        (cls: {
          _id: string;
          title: string;
          scheduledDate: string;
          description?: string;
        }) => ({
          id: cls._id,
          title: cls.title,
          date: new Date(cls.scheduledDate),
          type: "class" as const,
          description: cls.description,
        }),
      );

      const sessionEvents: CalendarEvent[] = (
        sessionsRes.data.data.sessions || []
      ).map(
        (session: {
          _id: string;
          topic: string;
          scheduledDate: string;
          description?: string;
        }) => ({
          id: session._id,
          title: session.topic,
          date: new Date(session.scheduledDate),
          type: "session" as const,
          description: session.description,
        }),
      );

      setEvents([...classEvents, ...sessionEvents]);
    } catch (error: unknown) {
      console.error("Failed to load calendar events:", error);
      toast.error(getErrorMessage(error, "Failed to load calendar"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const classCount = useMemo(
    () => events.filter((e) => e.type === "class").length,
    [events],
  );
  const sessionCount = useMemo(
    () => events.filter((e) => e.type === "session").length,
    [events],
  );

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-[#5B4BDB] shadow-lg shadow-primary/30 sm:h-11 sm:w-11">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black text-gray-900 sm:text-2xl">
              Calendar
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Your schedule at a glance
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <Badge className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 shadow-none ring-1 ring-sky-100">
            <Video className="mr-1.5 h-3.5 w-3.5" />
            {classCount} classes
          </Badge>
          <Badge className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-none ring-1 ring-emerald-100">
            <HeartHandshake className="mr-1.5 h-3.5 w-3.5" />
            {sessionCount} sessions
          </Badge>
        </div>
      </header>

      <CalendarView events={events} onEventClick={handleEventClick} />

      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={selectedEvent}
      />
    </div>
  );
};

export default Calendar;
