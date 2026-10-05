import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Video,
  HeartHandshake,
  FileQuestion,
  FileText,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

const typeMeta = {
  class: {
    icon: Video,
    label: "Live class",
    wrap: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  session: {
    icon: HeartHandshake,
    label: "Mentorship",
    wrap: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  quiz: {
    icon: FileQuestion,
    label: "Quiz",
    wrap: "bg-amber-50 text-amber-700",
    badge: "bg-amber-50 text-amber-800 ring-amber-100",
  },
  assignment: {
    icon: FileText,
    label: "Assignment",
    wrap: "bg-orange-50 text-orange-600",
    badge: "bg-orange-50 text-orange-700 ring-orange-100",
  },
} as const;

const EventModal = ({ open, onOpenChange, event }: EventModalProps) => {
  if (!event) return null;

  const meta = typeMeta[event.type];
  const Icon = meta.icon;
  const date = new Date(event.date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border-[#E5E7EB] p-0 sm:max-w-md">
        <div className="border-b border-[#E5E7EB]/80 bg-linear-to-br from-primary/8 via-white to-sky-50/60 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                meta.wrap,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <DialogHeader className="min-w-0 space-y-1.5 text-left">
              <DialogTitle className="text-lg font-black leading-snug wrap-break-word text-gray-900">
                {event.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {format(date, "EEEE, MMM d · h:mm a")}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <Badge
            className={cn(
              "rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold shadow-none ring-1",
              meta.badge,
            )}
          >
            {meta.label}
          </Badge>

          {event.description ? (
            <p className="text-sm leading-relaxed text-gray-600">
              {event.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400">No additional details.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
