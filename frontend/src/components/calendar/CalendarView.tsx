import { useMemo, useState } from "react";
import {
  format,
  isSameDay,
  isToday,
  isTomorrow,
  startOfDay,
  isBefore,
  addDays,
} from "date-fns";
import {
  CalendarDays,
  HeartHandshake,
  Video,
  ChevronRight,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CalendarEventCard from "@/components/calendar/CalendarEvent";
import EmptyState from "@/components/global/EmptyState";
import type { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

type FilterKey = "all" | "class" | "session";

const CalendarView = ({ events, onEventClick }: CalendarViewProps) => {
  const [month, setMonth] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Date>(new Date());
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const eventDates = useMemo(
    () => filteredEvents.map((e) => startOfDay(new Date(e.date))),
    [filteredEvents],
  );

  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((e) => isSameDay(new Date(e.date), selected))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [filteredEvents, selected]);

  const upcomingEvents = useMemo(() => {
    const now = startOfDay(new Date());
    return filteredEvents
      .filter((e) => !isBefore(startOfDay(new Date(e.date)), now))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [filteredEvents]);

  const thisWeekCount = useMemo(() => {
    const now = startOfDay(new Date());
    const weekEnd = addDays(now, 7);
    return filteredEvents.filter((e) => {
      const d = startOfDay(new Date(e.date));
      return !isBefore(d, now) && isBefore(d, weekEnd);
    }).length;
  }, [filteredEvents]);

  const todayCount = useMemo(
    () =>
      filteredEvents.filter((e) => isToday(new Date(e.date))).length,
    [filteredEvents],
  );

  const classCount = events.filter((e) => e.type === "class").length;
  const sessionCount = events.filter((e) => e.type === "session").length;

  const dayLabel = isToday(selected)
    ? "Today"
    : isTomorrow(selected)
      ? "Tomorrow"
      : format(selected, "EEEE, MMM d");

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Filters + stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white p-1 shadow-sm">
          {(
            [
              { id: "all" as const, label: "All", count: events.length },
              { id: "class" as const, label: "Classes", count: classCount },
              {
                id: "session" as const,
                label: "Mentorship",
                count: sessionCount,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-semibold transition-all sm:px-4",
                filter === tab.id
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-gray-500 hover:bg-gray-50",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]",
                  filter === tab.id ? "bg-white/20" : "bg-gray-100",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800 ring-1 ring-sky-100">
            <span className="font-bold tabular-nums">{todayCount}</span>
            today
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/15">
            <span className="font-bold tabular-nums">{thisWeekCount}</span>
            this week
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-5">
        {/* Month calendar */}
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB]/80 px-4 py-3 sm:px-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Month
              </p>
              <p className="mt-0.5 text-sm font-bold text-gray-900">
                {format(month, "MMMM yyyy")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full"
              onClick={() => {
                const today = new Date();
                setMonth(today);
                setSelected(today);
              }}
            >
              Today
            </Button>
          </div>

          <div className="flex justify-center p-3 sm:p-4">
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              onSelect={(day) => day && setSelected(day)}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{
                hasEvent:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
              className="w-full max-w-none [--cell-size:2.65rem] sm:[--cell-size:2.85rem]"
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full",
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#E5E7EB]/80 px-4 py-3 text-[11px] text-gray-500 sm:px-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Has events
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Video className="h-3 w-3 text-sky-500" />
              Class
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HeartHandshake className="h-3 w-3 text-emerald-600" />
              Mentorship
            </span>
          </div>
        </div>

        {/* Day agenda */}
        <div className="flex min-h-88 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="border-b border-[#E5E7EB]/80 px-4 py-3 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Agenda
                </p>
                <h2 className="mt-0.5 truncate text-base font-black text-gray-900 sm:text-lg">
                  {dayLabel}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {format(selected, "MMMM d, yyyy")}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="shrink-0 rounded-full bg-slate-100 font-semibold text-slate-700"
              >
                {selectedDayEvents.length}{" "}
                {selectedDayEvents.length === 1 ? "event" : "events"}
              </Badge>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
            {selectedDayEvents.length === 0 ? (
              <EmptyState
                className="py-10"
                title="Nothing scheduled"
                description="No classes or sessions on this day. Pick another date or check upcoming."
                icon={<CalendarDays className="h-7 w-7 text-muted-foreground" />}
              />
            ) : (
              selectedDayEvents.map((event) => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming strip */}
      {upcomingEvents.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB]/80 px-4 py-3 sm:px-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Coming up
              </p>
              <h2 className="mt-0.5 text-base font-black text-gray-900">
                Next on your schedule
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-full text-xs"
              onClick={() => {
                const next = upcomingEvents[0];
                if (!next) return;
                const d = new Date(next.date);
                setSelected(d);
                setMonth(d);
              }}
            >
              Jump to next
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid gap-2.5 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <CalendarEventCard
                key={`upcoming-${event.id}`}
                event={event}
                onClick={onEventClick}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default CalendarView;
