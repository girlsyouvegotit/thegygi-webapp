import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CalendarIcon,
  Clock3,
  Loader2,
  Timer,
} from "lucide-react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { liveClass } from "@/types";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liveClass: liveClass | null;
  onSuccess?: () => void;
}

const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

/** Common class start times (24h clock) */
const TIME_PRESETS = [
  { h: 9, m: 0, label: "9:00 AM" },
  { h: 10, m: 0, label: "10:00 AM" },
  { h: 11, m: 0, label: "11:00 AM" },
  { h: 12, m: 0, label: "12:00 PM" },
  { h: 13, m: 0, label: "1:00 PM" },
  { h: 14, m: 0, label: "2:00 PM" },
  { h: 15, m: 0, label: "3:00 PM" },
  { h: 16, m: 0, label: "4:00 PM" },
  { h: 17, m: 0, label: "5:00 PM" },
  { h: 18, m: 0, label: "6:00 PM" },
  { h: 19, m: 0, label: "7:00 PM" },
] as const;

const defaultFutureDate = () => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d;
};

const parseDate = (value: unknown): Date | null => {
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  return null;
};

const formatWhen = (date: Date | null) => {
  if (!date || !isValid(date)) return "Not set";
  return format(date, "EEE, MMM d · h:mm a");
};

const RescheduleDialog = ({
  open,
  onOpenChange,
  liveClass,
  onSuccess,
}: RescheduleDialogProps) => {
  const [scheduledDate, setScheduledDate] = useState<Date>(defaultFutureDate);
  const [duration, setDuration] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const originalDate = useMemo(
    () => (liveClass ? parseDate(liveClass.scheduledDate) : null),
    [liveClass],
  );

  useEffect(() => {
    if (!open || !liveClass) return;
    setScheduledDate(parseDate(liveClass.scheduledDate) ?? defaultFutureDate());
    setDuration(liveClass.duration || 60);
    setCalendarOpen(false);
  }, [open, liveClass]);

  const dateIsValid = isValid(scheduledDate);
  const isInFuture = dateIsValid && scheduledDate.getTime() > Date.now();
  const hasChanged =
    !originalDate ||
    !dateIsValid ||
    originalDate.getTime() !== scheduledDate.getTime() ||
    (liveClass?.duration || 60) !== duration;

  const validationMessage = !dateIsValid
    ? "Pick a valid date and time"
    : !isInFuture
      ? "New time must be in the future"
      : null;

  const relativeLabel =
    dateIsValid && isInFuture
      ? formatDistanceToNow(scheduledDate, { addSuffix: true })
      : null;

  const applyTime = (hours: number, minutes: number) => {
    const base = dateIsValid ? new Date(scheduledDate) : defaultFutureDate();
    base.setHours(hours, minutes, 0, 0);
    setScheduledDate(base);
  };

  const applyNextHalfHour = () => {
    const base = dateIsValid ? new Date(scheduledDate) : new Date();
    // Keep the selected calendar day; bump to next half-hour from "now"
    // if that day is today, otherwise default to 10:00 on the chosen day.
    const now = new Date();
    const sameDay =
      base.getFullYear() === now.getFullYear() &&
      base.getMonth() === now.getMonth() &&
      base.getDate() === now.getDate();

    if (sameDay) {
      const next = new Date(now);
      next.setSeconds(0, 0);
      const mins = next.getMinutes();
      if (mins === 0) {
        // already on the hour — jump +30
        next.setMinutes(30);
      } else if (mins <= 30) {
        next.setMinutes(30);
      } else {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      }
      // Preserve selected date's Y/M/D (today)
      base.setHours(next.getHours(), next.getMinutes(), 0, 0);
    } else {
      base.setHours(10, 0, 0, 0);
    }
    setScheduledDate(base);
  };

  const selectedTimeKey = dateIsValid
    ? `${scheduledDate.getHours()}:${scheduledDate.getMinutes()}`
    : "";

  const handleSave = async () => {
    if (!liveClass) return;

    if (!dateIsValid) {
      toast.error("Please pick a valid date and time");
      return;
    }
    if (!isInFuture) {
      toast.error("The new scheduled time must be in the future");
      return;
    }
    if (duration < 15 || duration > 300) {
      toast.error("Duration must be between 15 and 300 minutes");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/classes/${liveClass._id}/reschedule`, {
        scheduledDate: scheduledDate.toISOString(),
        duration,
      });
      toast.success("Class rescheduled");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to reschedule class");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-md gap-0 overflow-hidden rounded-[28px] border-slate-200/80 p-0 shadow-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-br from-[#F7F5FB] via-white to-violet-50/40 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/25">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-black tracking-tight text-slate-900">
                Reschedule class
              </DialogTitle>
              <DialogDescription className="mt-1 truncate text-sm text-slate-500">
                {liveClass?.title || "Update the date, time, and duration"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current
                </p>
                <p className="mt-1 text-xs font-semibold leading-snug text-slate-600">
                  {formatWhen(originalDate)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {liveClass?.duration || 60} min
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                  New
                </p>
                <p className="mt-1 text-xs font-semibold leading-snug text-slate-900">
                  {formatWhen(dateIsValid ? scheduledDate : null)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {duration} min
                  {relativeLabel ? ` · ${relativeLabel}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <CalendarIcon className="h-3 w-3" />
                Date
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start rounded-2xl border-slate-200 bg-[#F7F5FB] text-left font-medium hover:bg-white",
                      !dateIsValid && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-violet-500" />
                    <span className="truncate">
                      {dateIsValid
                        ? format(scheduledDate, "MMM d, yyyy")
                        : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-2rem)] max-w-[340px] rounded-2xl p-0"
                  align="start"
                  sideOffset={6}
                >
                  <Calendar
                    mode="single"
                    selected={dateIsValid ? scheduledDate : undefined}
                    onSelect={(date) => {
                      if (!date) return;
                      const next = new Date(date);
                      if (dateIsValid) {
                        next.setHours(
                          scheduledDate.getHours(),
                          scheduledDate.getMinutes(),
                          0,
                          0,
                        );
                      } else {
                        next.setHours(10, 0, 0, 0);
                      }
                      setScheduledDate(next);
                      setCalendarOpen(false);
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="min-w-0">
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Clock3 className="h-3 w-3" />
                Time
              </label>
              <Input
                type="time"
                value={dateIsValid ? format(scheduledDate, "HH:mm") : ""}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":");
                  if (h == null || m == null) return;
                  applyTime(parseInt(h, 10) || 0, parseInt(m, 10) || 0);
                }}
                className="h-11 rounded-2xl border-slate-200 bg-[#F7F5FB] text-base sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Clock3 className="h-3 w-3" />
              Quick time
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyNextHalfHour}
                className="h-9 rounded-full bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Next slot
              </button>
              {TIME_PRESETS.map((slot) => {
                const key = `${slot.h}:${slot.m}`;
                const active = selectedTimeKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTime(slot.h, slot.m)}
                    className={cn(
                      "h-9 rounded-full px-3.5 text-xs font-semibold transition",
                      active
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/25"
                        : "bg-[#F7F5FB] text-slate-600 hover:bg-violet-50 hover:text-violet-700",
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Timer className="h-3 w-3" />
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={cn(
                    "h-9 rounded-full px-3.5 text-xs font-semibold transition",
                    duration === mins
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/25"
                      : "bg-[#F7F5FB] text-slate-600 hover:bg-violet-50 hover:text-violet-700",
                  )}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <div className="relative mt-2">
              <Input
                type="number"
                min={15}
                max={300}
                value={duration}
                onChange={(e) =>
                  setDuration(parseInt(e.target.value, 10) || 60)
                }
                className="h-11 rounded-2xl border-slate-200 bg-[#F7F5FB] pr-16 text-base sm:text-sm"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                minutes
              </span>
            </div>
          </div>

          {validationMessage ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
              {validationMessage}
            </p>
          ) : relativeLabel ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              Students will see this class starting {relativeLabel}.
            </p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-full border-slate-200"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-full bg-violet-600 text-white shadow-md shadow-violet-600/20 hover:bg-violet-700"
              onClick={() => void handleSave()}
              disabled={
                submitting || !dateIsValid || !isInFuture || !hasChanged
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save new schedule"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
