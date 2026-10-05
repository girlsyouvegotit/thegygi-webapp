import {
  Video,
  HeartHandshake,
  FileQuestion,
  FileText,
  Clock,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow } from "date-fns";
import type { CalendarEvent as CalendarEventType } from "@/types/calendar";
import { cn } from "@/lib/utils";

interface CalendarEventProps {
  event: CalendarEventType;
  onClick?: (event: CalendarEventType) => void;
}

const eventConfig = {
  class: {
    icon: Video,
    label: "Class",
    accent: "bg-sky-50 text-sky-700 ring-sky-100",
    iconWrap: "bg-sky-50 text-sky-600",
  },
  session: {
    icon: HeartHandshake,
    label: "Mentorship",
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    iconWrap: "bg-emerald-50 text-emerald-600",
  },
  quiz: {
    icon: FileQuestion,
    label: "Quiz",
    accent: "bg-amber-50 text-amber-800 ring-amber-100",
    iconWrap: "bg-amber-50 text-amber-700",
  },
  assignment: {
    icon: FileText,
    label: "Assignment",
    accent: "bg-orange-50 text-orange-700 ring-orange-100",
    iconWrap: "bg-orange-50 text-orange-600",
  },
} as const;

const dateChip = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
};

const CalendarEvent = ({ event, onClick }: CalendarEventProps) => {
  const config = eventConfig[event.type];
  const Icon = config.icon;
  const date = new Date(event.date);

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-2xl border border-[#E5E7EB]/90 bg-white p-3 text-left transition-all",
        "hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99]",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          config.iconWrap,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-gray-900 group-hover:text-primary">
            {event.title}
          </p>
          <Badge
            className={cn(
              "shrink-0 rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold shadow-none ring-1",
              config.accent,
            )}
          >
            {config.label}
          </Badge>
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 font-medium text-gray-600">
            <Clock className="h-3 w-3 shrink-0" />
            {dateChip(date)} · {format(date, "h:mm a")}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          ) : null}
        </p>

        {event.description ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {event.description}
          </p>
        ) : null}
      </div>
    </button>
  );
};

export default CalendarEvent;
