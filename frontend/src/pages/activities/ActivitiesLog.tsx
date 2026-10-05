import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  eachDayOfInterval,
  eachHourOfInterval,
  endOfDay,
  format,
  formatDistanceToNow,
  isSameDay,
  isToday,
  startOfDay,
  subDays,
} from "date-fns";
import {
  Activity as ActivityIcon,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_FILTERS,
  getActivityConfig,
  getInitials,
  matchesActivityFilter,
} from "@/components/activities/activityConfig";
import type { ActivityEventItem } from "@/components/activities/ActivityEventCard";
import ActivityDetailDialog from "@/components/activities/ActivityDetailDialog";
import ActivityActorProfileDialog, {
  type ActivityActorSummary,
} from "@/components/activities/ActivityActorProfileDialog";
import ActivityVolumeViz, {
  type VolumePoint,
} from "@/components/activities/ActivityVolumeViz";

interface ApiError {
  response?: { data?: { message?: string } };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

const PAGE_SIZE = 5;
const SAMPLE_LIMIT = 200;

const seedActionForFilter = (value: string): string => {
  switch (value) {
    case "deletion":
      return "delete";
    case "creation":
      return "create";
    case "update":
      return "update";
    case "finance":
      return "payment";
    case "authentication":
      return "login";
    case "assignment":
      return "assign";
    case "moderation":
      return "suspend";
    default:
      return "activity";
  }
};

const ActivitiesLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityEventItem[]>([]);
  const [sampleLogs, setSampleLogs] = useState<ActivityEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [range, setRange] = useState<"24h" | "weekly">("weekly");
  const [selectedLog, setSelectedLog] = useState<ActivityEventItem | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [actors, setActors] = useState<ActivityActorSummary[]>([]);
  const [selectedActor, setSelectedActor] =
    useState<ActivityActorSummary | null>(null);
  const [now, setNow] = useState(() => new Date());
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dateParam = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const dayParam = dateParam ? `&date=${dateParam}` : "";
      const { data } = await api.get(
        `/activities?page=${page}&limit=${PAGE_SIZE}${dayParam}`,
      );
      const fetchedLogs = (data.data?.logs ||
        data.logs ||
        []) as ActivityEventItem[];
      const pagination = data.pagination || data.data?.pagination || {};
      setLogs(fetchedLogs);
      setTotalPages(pagination.pages || data.pages || 1);
      setTotalItems(pagination.total || fetchedLogs.length);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load activity logs"));
      setLogs([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, dateParam]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    let cancelled = false;
    const loadSample = async () => {
      try {
        const { data } = await api.get(
          `/activities?page=1&limit=${SAMPLE_LIMIT}`,
        );
        const sample = (data.data?.logs ||
          data.logs ||
          []) as ActivityEventItem[];
        if (cancelled) return;
        setSampleLogs(sample);

        const map = new Map<string, ActivityActorSummary>();
        sample.forEach((log) => {
          const id = log.user?._id || "system";
          const existing = map.get(id);
          if (existing) {
            existing.count += 1;
            if (
              !existing.lastActionAt ||
              new Date(log.createdAt) > new Date(existing.lastActionAt)
            ) {
              existing.lastActionAt = log.createdAt;
              existing.lastAction = log.action;
            }
          } else {
            map.set(id, {
              id,
              name: log.user?.name || "System",
              role: log.user?.role,
              avatar: log.user?.avatar,
              email: log.user?.email,
              count: 1,
              lastActionAt: log.createdAt,
              lastAction: log.action,
            });
          }
        });
        setActors(Array.from(map.values()).sort((a, b) => b.count - a.count));
      } catch {
        if (!cancelled) {
          setSampleLogs([]);
          setActors([]);
        }
      }
    };
    void loadSample();
    return () => {
      cancelled = true;
    };
  }, [totalItems]);

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: subDays(startOfDay(new Date()), 6),
        end: startOfDay(new Date()),
      }),
    // refresh day boundaries with clock tick once/day is enough; use now date key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [format(now, "yyyy-MM-dd")],
  );

  const hoursToday = useMemo(
    () =>
      eachHourOfInterval({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [format(now, "yyyy-MM-dd")],
  );

  const rangeLogs = useMemo(() => {
    if (range === "24h") {
      const start = startOfDay(new Date());
      return sampleLogs.filter((log) => new Date(log.createdAt) >= start);
    }
    const start = subDays(startOfDay(new Date()), 6);
    return sampleLogs.filter((log) => new Date(log.createdAt) >= start);
  }, [sampleLogs, range]);

  const filteredRangeLogs = useMemo(
    () =>
      rangeLogs.filter((log) => matchesActivityFilter(log.action, filter)),
    [rangeLogs, filter],
  );

  const volumePoints = useMemo((): VolumePoint[] => {
    if (range === "weekly") {
      return weekDays.map((day) => {
        const bucket = filteredRangeLogs.filter((log) =>
          isSameDay(new Date(log.createdAt), day),
        );
        const actorIds = new Set(
          bucket.map((log) => log.user?._id || "system"),
        );
        return {
          key: format(day, "yyyy-MM-dd"),
          label: format(day, "EEE"),
          date: day,
          events: bucket.length,
          actors: actorIds.size,
        };
      });
    }

    return hoursToday
      .filter((_, i) => i % 2 === 0)
      .map((hour) => {
        const h = hour.getHours();
        const bucket = filteredRangeLogs.filter((log) => {
          const d = new Date(log.createdAt);
          return isToday(d) && d.getHours() >= h && d.getHours() < h + 2;
        });
        const actorIds = new Set(
          bucket.map((log) => log.user?._id || "system"),
        );
        return {
          key: String(h),
          label: format(hour, "Ha"),
          date: hour,
          events: bucket.length,
          actors: actorIds.size,
        };
      });
  }, [range, weekDays, hoursToday, filteredRangeLogs]);

  const visibleLogs = useMemo(() => {
    let next = logs.filter((log) => matchesActivityFilter(log.action, filter));
    if (range === "24h" && selectedHour != null) {
      next = next.filter((log) => {
        const h = new Date(log.createdAt).getHours();
        return h >= selectedHour && h < selectedHour + 2;
      });
    }
    return next;
  }, [logs, filter, range, selectedHour]);

  const todayCount = rangeLogs.filter((log) =>
    isToday(new Date(log.createdAt)),
  ).length;

  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    rangeLogs.forEach((log) => {
      const key = getActivityConfig(log.action).filterKey;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [rangeLogs]);

  const creationRate = useMemo(() => {
    const created = typeBreakdown.creation || 0;
    const base = Math.max(rangeLogs.length, 1);
    return Math.round((created / base) * 100);
  }, [typeBreakdown, rangeLogs.length]);

  const leadActor = actors[0] || null;
  const firstName = (user?.name || "there").split(" ")[0];

  const rangeLabel =
    range === "24h"
      ? format(new Date(), "MMM d")
      : `${format(subDays(new Date(), 6), "MMM d")} – ${format(new Date(), "MMM d")}`;

  const railFilters = ACTIVITY_FILTERS.filter((f) => f.value !== "all");

  const volumeFilterTabs = useMemo(
    () =>
      ACTIVITY_FILTERS.map((f) => ({
        value: f.value,
        label: f.value === "all" ? "Overview" : f.label,
      })),
    [],
  );

  const activePointKey =
    range === "weekly"
      ? selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : null
      : selectedHour != null
        ? String(selectedHour)
        : null;

  const onSelectVolumePoint = (point: VolumePoint) => {
    setPage(1);
    if (range === "weekly") {
      setSelectedDate(point.date);
      setSelectedHour(null);
    } else {
      setSelectedDate(new Date());
      setSelectedHour(point.date.getHours());
    }
  };

  const setRangeMode = (next: "24h" | "weekly") => {
    setRange(next);
    setSelectedDate(undefined);
    setSelectedHour(null);
    setPage(1);
  };

  return (
    <div
      ref={topRef}
      className="relative mx-auto w-full max-w-[1480px] pb-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/3 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-56 w-56 rounded-full bg-slate-200/40 blur-3xl" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[64px_minmax(0,1fr)] lg:gap-5">
        {/* Slim icon rail — no duplicate logo */}
        <aside className="hidden lg:flex lg:flex-col lg:items-center lg:gap-2.5 lg:rounded-[2rem] lg:bg-white lg:px-1.5 lg:py-4 lg:shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)] lg:ring-1 lg:ring-black/5">
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition",
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "bg-[#F3F4F6] text-slate-500 hover:bg-slate-200",
            )}
            title="Overview"
          >
            <ActivityIcon className="h-4 w-4" />
          </button>
          {railFilters.map((option) => {
            const cfg = getActivityConfig(seedActionForFilter(option.value));
            const Icon = cfg.icon;
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                onClick={() => {
                  setFilter(option.value);
                  setPage(1);
                }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "bg-[#F3F4F6] text-slate-500 hover:bg-slate-200",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          <div className="mt-auto flex flex-col items-center gap-2 pt-4">
            <p className="text-[11px] font-bold tabular-nums text-slate-900">
              {format(now, "HH:mm")}
            </p>
            <button
              type="button"
              onClick={() => void fetchLogs()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-md"
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn("h-4 w-4", loading && "animate-spin")}
              />
            </button>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-lg font-medium tracking-tight text-slate-500 sm:text-xl">
                Hi {firstName},{" "}
                <span className="font-semibold text-slate-900">
                  welcome to Activity.
                </span>
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {leadActor && (
                <button
                  type="button"
                  onClick={() => setSelectedActor(leadActor)}
                  className="inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm ring-1 ring-black/5 transition hover:shadow-md sm:pr-4"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    {leadActor.avatar ? (
                      <AvatarImage
                        src={leadActor.avatar}
                        alt={leadActor.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-900 text-[10px] font-bold text-white">
                      {getInitials(leadActor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-sm font-bold leading-tight text-slate-900">
                      {leadActor.name}
                    </span>
                    <span className="block truncate text-[11px] capitalize text-slate-500">
                      Top actor · {leadActor.count} events
                    </span>
                  </span>
                </button>
              )}

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-black/5",
                      selectedDate && "ring-primary/40 text-primary",
                    )}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "EEE, d MMM")
                      : format(now, "EEE, d MMM")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(day) => {
                      setSelectedDate(day);
                      setSelectedHour(null);
                      setPage(1);
                      setCalendarOpen(false);
                    }}
                    disabled={{ after: new Date() }}
                    initialFocus
                  />
                  <div className="flex gap-2 border-t p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={() => {
                        setSelectedDate(undefined);
                        setSelectedHour(null);
                        setPage(1);
                        setCalendarOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={() => {
                        setSelectedDate(new Date());
                        setSelectedHour(null);
                        setPage(1);
                        setCalendarOpen(false);
                      }}
                    >
                      Today
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-black/5">
                {rangeLabel}
              </span>
              <button
                type="button"
                onClick={() => setRangeMode("24h")}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-semibold transition",
                  range === "24h"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-black/5",
                )}
              >
                24h
              </button>
              <button
                type="button"
                onClick={() => setRangeMode("weekly")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition",
                  range === "weekly"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-black/5",
                )}
              >
                Weekly
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(undefined);
                    setSelectedHour(null);
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-2 text-xs font-bold text-primary"
                >
                  {format(selectedDate, "MMM d")}
                  {selectedHour != null
                    ? ` · ${selectedHour}:00–${selectedHour + 2}:00`
                    : ""}
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ACTIVITY_FILTERS.map((option) => {
                const active = filter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilter(option.value);
                      setPage(1);
                    }}
                    className={cn(
                      "inline-flex shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-slate-600 ring-1 ring-black/5",
                    )}
                  >
                    {option.value === "all" ? "Overview" : option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label={range === "weekly" ? "Week events" : "Today events"}
              value={String(rangeLogs.length)}
              delta={`+${todayCount} today`}
            />
            <KpiCard
              label="Active actors"
              value={String(actors.length)}
              delta={`${leadActor?.name?.split(" ")[0] || "—"} leads`}
            />
            <KpiCard
              label="Creations"
              value={`${creationRate}%`}
              delta={range === "weekly" ? "this week" : "today"}
            />
            <KpiCard
              label="This page"
              value={`${visibleLogs.length}/${PAGE_SIZE}`}
              delta={`Page ${page} of ${Math.max(totalPages, 1)}`}
            />
          </div>

          {/* Heatmap + Event log — stack early, never clip */}
          <div className="grid min-w-0 gap-4 lg:grid-cols-1 xl:grid-cols-12">
            <section className="min-w-0 overflow-hidden rounded-[1.75rem] bg-[#14141A] p-3 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.55)] ring-1 ring-white/10 sm:p-5 xl:col-span-7">
              <ActivityVolumeViz
                points={volumePoints}
                filters={volumeFilterTabs}
                activeFilter={filter}
                onFilterChange={(value) => {
                  setFilter(value);
                  setPage(1);
                }}
                activePointKey={activePointKey}
                onSelectPoint={onSelectVolumePoint}
                title="Activity volume"
              />
              <p className="mt-3 text-right text-[11px] font-semibold text-white/40">
                {filteredRangeLogs.length} in range ·{" "}
                {range === "weekly" ? "weekly" : "24h"} series
              </p>
            </section>

            <section className="flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.4)] ring-1 ring-black/5 sm:p-5 xl:col-span-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Timeline
                  </p>
                  <h2 className="truncate text-lg font-black text-slate-900">
                    Event log
                  </h2>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                  {PAGE_SIZE}/page
                </span>
              </div>

              {loading ? (
                <div className="flex min-h-48 flex-1 items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading…
                </div>
              ) : visibleLogs.length === 0 ? (
                <div className="flex min-h-48 flex-1 flex-col items-center justify-center text-center">
                  <ActivityIcon className="mb-2 h-6 w-6 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No events</p>
                  <p className="mt-1 max-w-[16rem] text-xs text-slate-400">
                    Clear day filters or pick another point on the chart.
                  </p>
                </div>
              ) : (
                <ul className="min-w-0 flex-1 divide-y divide-slate-100">
                  {visibleLogs.map((log) => {
                    const config = getActivityConfig(log.action);
                    const Icon = config.icon;
                    return (
                      <li key={log._id} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="flex w-full min-w-0 items-center gap-2.5 py-3 text-left transition hover:bg-[#FAFAFA] sm:gap-3"
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10",
                              config.iconBg,
                            )}
                          >
                            <Icon
                              className={cn("h-4 w-4", config.iconColor)}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {log.action}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {log.user?.name || "System"} ·{" "}
                              {formatDistanceToNow(new Date(log.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <span className="hidden shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary sm:inline">
                            {config.label}
                          </span>
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0"
                      disabled={page === 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0"
                      disabled={page === totalPages || loading}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-12">
            <section className="relative min-w-0 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-lg lg:col-span-5">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full bg-primary/40 blur-3xl"
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                Pulse check
              </p>
              <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                Stay on top of workspace moves
              </h3>
              <p className="mt-2 max-w-sm text-sm text-white/65">
                {todayCount} events today · {rangeLogs.length} in{" "}
                {range === "weekly" ? "this week" : "the last 24h"} across{" "}
                {actors.length} actors.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setSelectedDate(undefined);
                    setSelectedHour(null);
                    setRangeMode("weekly");
                    topRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
                >

                  Weekly overview
                </button>
                <button
                  type="button"
                  onClick={() => void fetchLogs()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white ring-1 ring-white/15"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Refresh feed
                </button>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.4)] ring-1 ring-black/5 sm:p-5 lg:col-span-7">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Event notes
                    </p>
                    <h3 className="truncate text-lg font-black text-slate-900">
                      All actors
                    </h3>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  {actors.length}
                </span>
              </div>

              {actors.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No actors yet
                </p>
              ) : (
                <ul className="max-h-64 space-y-1 overflow-y-auto overscroll-contain">
                  {actors.map((actor, index) => (
                    <li key={actor.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedActor(actor)}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-2.5 rounded-2xl px-2 py-2.5 text-left transition sm:gap-3 sm:px-2.5",
                          index === 0
                            ? "bg-primary/15"
                            : "hover:bg-[#F7F7F8]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                            index === 0
                              ? "bg-slate-900 text-white"
                              : "bg-white text-transparent ring-1 ring-slate-200",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <Avatar className="h-9 w-9 shrink-0 border border-white shadow-sm">
                          {actor.avatar ? (
                            <AvatarImage src={actor.avatar} alt={actor.name} />
                          ) : null}
                          <AvatarFallback className="bg-slate-800 text-[10px] font-bold text-white">
                            {getInitials(actor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {actor.name}
                          </p>
                          <p className="truncate text-[11px] capitalize text-slate-500">
                            {actor.role?.replace(/_/g, " ") || "System"}
                            {actor.lastAction
                              ? ` · ${actor.lastAction}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums",
                            index === 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-[#F3F4F6] text-slate-600",
                          )}
                        >
                          {actor.count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      <ActivityDetailDialog
        log={selectedLog}
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />

      <ActivityActorProfileDialog
        actor={selectedActor}
        open={Boolean(selectedActor)}
        onOpenChange={(open) => {
          if (!open) setSelectedActor(null);
        }}
      />
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) => (
  <div className="min-w-0 rounded-[1.5rem] bg-white p-3 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)] ring-1 ring-black/5 sm:p-4">
    <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
      {label}
    </p>
    <p className="mt-1 truncate text-2xl font-black tracking-tight text-slate-900 tabular-nums sm:text-3xl">
      {value}
    </p>
    <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
      {delta}
    </span>
  </div>
);

export default ActivitiesLog;
