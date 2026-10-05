import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import {
  Plus,
  Video,
  Radio,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Users,
  ArrowUpRight,
  ChevronRight,
  Search,
  Zap,
  PlayCircle,
  FileQuestion,
  FileText,
  TrendingUp,
  BarChart3,
  LayoutDashboard,
  Calendar,
  AlertCircle,
  CalendarClock,
  Lock,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { liveClass } from "@/types";
import { cn } from "@/lib/utils";
import RescheduleDialog from "@/components/classes/RescheduleDialog";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

type FilterKey = "all" | "scheduled" | "live" | "completed";

const STATUS_META: Record<
  string,
  {
    label: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    dotClass: string;
    barClass: string;
    leftAccent: string;
    dateChipClass: string;
  }
> = {
  scheduled: {
    label: "Scheduled",
    textClass: "text-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/20",
    dotClass: "bg-primary",
    barClass: "from-primary to-primary/70",
    leftAccent: "border-l-primary",
    dateChipClass: "bg-primary/10 text-primary",
  },
  live: {
    label: "Live",
    textClass: "text-rose-600",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-200",
    dotClass: "bg-rose-500 animate-pulse",
    barClass: "from-rose-500 to-rose-400",
    leftAccent: "border-l-rose-500",
    dateChipClass: "bg-rose-50 text-rose-700",
  },
  ended: {
    label: "Ended",
    textClass: "text-slate-600",
    bgClass: "bg-slate-500/10",
    borderClass: "border-slate-200",
    dotClass: "bg-slate-400",
    barClass: "from-slate-400 to-slate-300",
    leftAccent: "border-l-slate-400",
    dateChipClass: "bg-slate-100 text-slate-700",
  },
  processing: {
    label: "Processing",
    textClass: "text-amber-600",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-200",
    dotClass: "bg-amber-500",
    barClass: "from-amber-500 to-amber-400",
    leftAccent: "border-l-amber-500",
    dateChipClass: "bg-amber-50 text-amber-800",
  },
  recorded: {
    label: "Recorded",
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-200",
    dotClass: "bg-emerald-500",
    barClass: "from-emerald-500 to-emerald-400",
    leftAccent: "border-l-emerald-500",
    dateChipClass: "bg-emerald-50 text-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    textClass: "text-rose-500",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-200",
    dotClass: "bg-rose-400",
    barClass: "from-rose-400 to-rose-300",
    leftAccent: "border-l-rose-400",
    dateChipClass: "bg-rose-50 text-rose-600",
  },
};

const FALLBACK_META = {
  label: "Unknown",
  textClass: "text-slate-600",
  bgClass: "bg-slate-500/10",
  borderClass: "border-slate-200",
  dotClass: "bg-slate-400",
  barClass: "from-slate-400 to-slate-300",
  leftAccent: "border-l-slate-300",
  dateChipClass: "bg-slate-100 text-slate-700",
};

const statusMeta = (status: string) => STATUS_META[status] ?? FALLBACK_META;

const canStartNow = (cls: liveClass): { allowed: boolean; reason?: string } => {
  if (cls.status === "live") return { allowed: true };
  if (cls.status !== "scheduled") {
    return { allowed: false, reason: "Not scheduled" };
  }
  const now = Date.now();
  const scheduled = new Date(cls.scheduledDate).getTime();
  if (now < scheduled) {
    const when = new Date(cls.scheduledDate).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return { allowed: false, reason: `Starts ${when}` };
  }
  return { allowed: true };
};

const DateChip = ({
  dateStr,
  chipClass,
}: {
  dateStr: string;
  chipClass: string;
}) => {
  const d = new Date(dateStr);
  return (
    <div
      className={cn(
        "flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
        chipClass,
      )}
    >
      <span className="text-[9px] font-bold uppercase opacity-80">
        {format(d, "MMM")}
      </span>
      <span className="text-lg font-black">{format(d, "d")}</span>
    </div>
  );
};

const MyClasses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<liveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<liveClass | null>(
    null,
  );
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/classes");
      setClasses((data.data.classes as liveClass[]) || []);
    } catch (error) {
      console.error("Failed to load classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleStartClass = useCallback(
    async (cls: liveClass) => {
      const gate = canStartNow(cls);
      if (!gate.allowed) {
        toast.error(gate.reason || "Class cannot be started yet");
        return;
      }
      setStartingId(cls._id);
      try {
        await api.post(`/classes/${cls._id}/start`);
        navigate(`/tutor/classes/${cls._id}/live`);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to start class");
        setStartingId(null);
      }
    },
    [navigate],
  );

  const handleJoinClass = useCallback(
    (classId: string) => {
      navigate(`/tutor/classes/${classId}/live`);
    },
    [navigate],
  );

  const handleEndClassFromList = useCallback(
    async (classId: string) => {
      try {
        await api.post(`/classes/${classId}/end`);
        toast.success("Class ended for everyone");
        await fetchClasses();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to end class");
      }
    },
    [fetchClasses],
  );

  const handleOpenReschedule = useCallback((cls: liveClass) => {
    setRescheduleTarget(cls);
    setRescheduleOpen(true);
  }, []);

  const stats = useMemo(() => {
    const live = classes.filter((c) => c.status === "live");
    const scheduled = classes.filter((c) => c.status === "scheduled");
    const completed = classes.filter(
      (c) => c.status === "ended" || c.status === "recorded",
    );
    const processing = classes.filter((c) => c.status === "processing");
    return {
      total: classes.length,
      live: live.length,
      scheduled: scheduled.length,
      completed: completed.length,
      processing: processing.length,
      liveList: live,
    };
  }, [classes]);

  const nextClass = useMemo(() => {
    const now = new Date();
    return classes
      .filter(
        (c) => c.status === "scheduled" && new Date(c.scheduledDate) > now,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime(),
      )[0];
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes
      .filter((c) => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.category?.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
        );
      })
      .filter((c) => {
        if (filter === "all") return true;
        if (filter === "live") return c.status === "live";
        if (filter === "scheduled") return c.status === "scheduled";
        if (filter === "completed")
          return c.status === "ended" || c.status === "recorded";
        return true;
      })
      .sort((a, b) => {
        const rank = (c: liveClass) => {
          if (c.status === "live") return 0;
          if (c.status === "scheduled") return 1;
          return 2;
        };
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        const ta = new Date(a.scheduledDate).getTime();
        const tb = new Date(b.scheduledDate).getTime();
        return ra === 2 ? tb - ta : ta - tb;
      });
  }, [classes, search, filter]);

  const getDateBadge = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
  };

  const timeLabel = (dateStr: string): string => {
    const d = new Date(dateStr);
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: classes.length },
    { key: "live", label: "Live", count: stats.live },
    { key: "scheduled", label: "Scheduled", count: stats.scheduled },
    { key: "completed", label: "Completed", count: stats.completed },
  ];

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Tutor";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="rounded-3xl border border-slate-100 bg-white px-10 py-12 text-center shadow-sm">
          <div className="relative mx-auto">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <Video className="absolute inset-0 m-auto h-5 w-5 animate-pulse text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading your classes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[1680px] space-y-6 pb-10 pt-1 sm:space-y-7">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-32 h-48 w-48 rounded-full bg-rose-100/40 blur-3xl" />
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Video className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[1.75rem]">
              Hi, {firstName}!
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-medium text-slate-700">My Classes</span>
              <span className="mx-1.5 text-slate-300">|</span>
              Your classroom sessions and live teaching
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white text-xs text-slate-600 hover:text-slate-900"
            onClick={() => navigate("/tutor/dashboard")}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-xl bg-primary text-xs text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90"
            onClick={() => navigate("/tutor/schedule")}
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule Class
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          {
            label: "Total Classes",
            subtitle: "All sessions",
            value: stats.total,
            icon: Video,
            iconBg: "bg-primary/10 text-primary",
            onClick: () => setFilter("all"),
          },
          {
            label: "Live Now",
            subtitle: "In progress",
            value: stats.live,
            icon: Radio,
            iconBg: "bg-rose-100 text-rose-600",
            onClick: () => setFilter("live"),
            pulse: stats.live > 0,
          },
          {
            label: "Scheduled",
            subtitle: "Upcoming",
            value: stats.scheduled,
            icon: CalendarPlus,
            iconBg: "bg-violet-100 text-violet-600",
            onClick: () => setFilter("scheduled"),
          },
          {
            label: "Completed",
            subtitle: "Delivered",
            value: stats.completed,
            icon: CheckCircle2,
            iconBg: "bg-emerald-100 text-emerald-600",
            onClick: () => setFilter("completed"),
          },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-slate-200 hover:shadow-md sm:p-5"
          >
            <div
              className={cn(
                "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl",
                stat.iconBg,
              )}
            >
              <stat.icon className="h-4 w-4" />
              {stat.pulse && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500">
                  <span className="absolute inset-0 animate-ping rounded-full bg-rose-500" />
                </span>
              )}
            </div>
            <p className="pr-12 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-800">{stat.label}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{stat.subtitle}</p>
            <ArrowUpRight className="mt-3 h-3.5 w-3.5 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>

      {stats.liveList.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-rose-100 border-l-4 border-l-rose-500 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Radio className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Live now
                  </p>
                </div>
                <p className="truncate text-base font-black text-slate-900">
                  {stats.liveList[0].title}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {stats.liveList[0].category?.name}
                  {stats.liveList.length > 1 && (
                    <> · +{stats.liveList.length - 1} more live</>
                  )}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleJoinClass(stats.liveList[0]._id)}
              className="h-9 shrink-0 gap-1.5 self-start rounded-xl bg-rose-600 font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 sm:self-auto"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Enter Class
            </Button>
          </div>
        </section>
      )}

      {nextClass && (
        <section className="rounded-3xl border border-slate-100 bg-[#FAFBFD] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <DateChip
                dateStr={nextClass.scheduledDate}
                chipClass="bg-primary/10 text-primary"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Coming up next
                </p>
                <p className="truncate text-base font-black text-slate-900">
                  {nextClass.title}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  <span className="mr-1.5 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-100">
                    {getDateBadge(nextClass.scheduledDate)}
                  </span>
                  {format(new Date(nextClass.scheduledDate), "h:mm a")} ·{" "}
                  {nextClass.duration} min
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
              <span className="hidden text-[11px] font-semibold text-slate-500 sm:inline">
                {timeLabel(nextClass.scheduledDate)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white text-xs text-slate-600 hover:border-primary/30 hover:text-primary"
                onClick={() => handleOpenReschedule(nextClass)}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Reschedule
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-1 flex items-center gap-2 px-0.5 sm:px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Browse classes</h2>
            <p className="text-[11px] text-slate-500">Filter and search your sessions</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <div className="scrollbar-hide flex shrink-0 items-center gap-1 overflow-x-auto rounded-full bg-slate-50 p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-all sm:px-4",
                  filter === tab.key
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-slate-500 hover:bg-white hover:text-slate-900",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    filter === tab.key
                      ? "bg-white/25 text-white"
                      : "bg-slate-200 text-slate-600",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by title, category, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-full border-slate-200 bg-[#FAFBFD] pl-10 text-sm focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </section>

      {filteredClasses.length === 0 ? (
        <section className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            {search || filter !== "all" ? (
              <AlertCircle className="h-7 w-7 text-slate-400" />
            ) : (
              <Video className="h-7 w-7 text-slate-400" />
            )}
          </div>
          <p className="text-sm font-bold text-slate-800">
            {search
              ? `No classes match "${search}"`
              : filter !== "all"
                ? `No ${filter} classes`
                : "No classes yet"}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
            {search || filter !== "all"
              ? "Try clearing the search or switching tabs"
              : "Schedule your first class to get started"}
          </p>
          {(search || filter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-5 h-9 rounded-xl"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
          {!search && filter === "all" && (
            <Button
              size="sm"
              className="mt-5 h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              onClick={() => navigate("/tutor/schedule")}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Schedule First Class
            </Button>
          )}
        </section>
      ) : (
        <ul className="space-y-3">
          {filteredClasses.map((cls) => {
            const meta = statusMeta(cls.status);
            const isLive = cls.status === "live";
            const isScheduled = cls.status === "scheduled";
            const isStarting = startingId === cls._id;
            const classDate = new Date(cls.scheduledDate);
            const gate = canStartNow(cls);

            return (
              <li key={cls._id}>
                <article
                  className={cn(
                    "overflow-hidden rounded-2xl border border-slate-100 border-l-4 bg-white shadow-sm transition hover:shadow-md",
                    meta.leftAccent,
                    isLive && "ring-1 ring-rose-100",
                  )}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
                    <DateChip
                      dateStr={cls.scheduledDate}
                      chipClass={meta.dateChipClass}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            meta.bgClass,
                            meta.textClass,
                            meta.borderClass,
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              meta.dotClass,
                            )}
                          />
                          {meta.label}
                        </span>
                        {cls.category && (
                          <Badge
                            variant="outline"
                            className="max-w-[140px] truncate rounded-full border-slate-200 text-[10px] text-slate-600"
                          >
                            {cls.category.name}
                          </Badge>
                        )}
                        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {getDateBadge(cls.scheduledDate)}
                        </span>
                      </div>

                      <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">
                        {cls.title}
                      </h3>
                      {cls.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {cls.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(classDate, "h:mm a")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {cls.maxParticipants} seats
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {cls.duration} min
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-1.5 text-[10px] font-semibold",
                          isLive ? "text-rose-500" : "text-slate-400",
                        )}
                      >
                        {isLive ? "Happening now" : timeLabel(cls.scheduledDate)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:max-w-xs sm:shrink-0 sm:flex-col sm:items-stretch lg:max-w-[220px]">
                      {isLive && (
                        <>
                          <Button
                            size="sm"
                            className="h-9 flex-1 gap-1.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 sm:w-full"
                            onClick={() => handleJoinClass(cls._id)}
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            Enter Class
                          </Button>
                          <div className="flex w-full gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 flex-1 gap-1.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                              onClick={() => void handleEndClassFromList(cls._id)}
                              title="End class"
                            >
                              End
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 flex-1 gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                              onClick={() =>
                                navigate(`/tutor/classes/${cls._id}/analytics`)
                              }
                            >
                              <BarChart2 className="h-3.5 w-3.5" />
                              Details
                            </Button>
                          </div>
                        </>
                      )}

                      {(cls.status === "processing" ||
                        cls.status === "ended" ||
                        cls.status === "recorded") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-full cursor-default gap-1.5 rounded-xl border-slate-200 text-slate-600"
                            disabled
                          >
                            <Lock className="h-3.5 w-3.5" />
                            {cls.status === "processing"
                              ? "Processing…"
                              : "Class ended"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-full gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                            onClick={() =>
                              navigate(`/tutor/classes/${cls._id}/analytics`)
                            }
                          >
                            <BarChart2 className="h-3.5 w-3.5" />
                            Details
                          </Button>
                        </>
                      )}

                      {isScheduled && (
                        <>
                          <Button
                            size="sm"
                            className={cn(
                              "h-9 w-full gap-1.5 rounded-xl shadow-md",
                              gate.allowed
                                ? "bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90"
                                : "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none hover:bg-slate-200",
                            )}
                            onClick={() => gate.allowed && handleStartClass(cls)}
                            disabled={!gate.allowed || isStarting}
                            title={gate.reason}
                          >
                            {isStarting ? (
                              <>
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Starting…
                              </>
                            ) : gate.allowed ? (
                              <>
                                <Video className="h-3.5 w-3.5" />
                                Start Class
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                <span className="truncate">{gate.reason}</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-full gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                            onClick={() => handleOpenReschedule(cls)}
                            title="Reschedule class"
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            Reschedule
                          </Button>
                        </>
                      )}

                      {!isLive && !isScheduled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-full gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                          onClick={() =>
                            navigate(`/tutor/classes/${cls._id}/analytics`)
                          }
                        >
                          View Details
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <section className="rounded-3xl border border-slate-100 bg-[#FAFBFD] p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
            <p className="text-[11px] text-slate-500">
              Everything you need to run your classroom
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Schedule Class",
              description: "Set up a session",
              icon: CalendarPlus,
              url: "/tutor/schedule",
              iconBg: "bg-primary/10 text-primary",
            },
            {
              label: "Quizzes",
              description: "Assess learning",
              icon: FileQuestion,
              url: "/tutor/quizzes",
              iconBg: "bg-violet-100 text-violet-600",
            },
            {
              label: "Assignments",
              description: "Assign work",
              icon: FileText,
              url: "/tutor/assignments",
              iconBg: "bg-amber-100 text-amber-600",
            },
            {
              label: "Analytics",
              description: "Track progress",
              icon: BarChart3,
              url: "/tutor/analytics",
              iconBg: "bg-emerald-100 text-emerald-600",
            },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.url)}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-slate-200 hover:shadow-sm"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  action.iconBg,
                )}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 w-full">
                <p className="truncate text-sm font-bold text-slate-900">
                  {action.label}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {action.description}
                </p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 self-end text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-white to-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                Classroom snapshot
              </p>
              <p className="text-base font-black text-slate-900">
                {stats.completed} classes delivered
                {stats.processing > 0 && <> · {stats.processing} processing</>}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                {stats.live > 0
                  ? `${stats.live} live right now — join the session in progress`
                  : stats.scheduled > 0
                    ? `${stats.scheduled} upcoming — stay prepared`
                    : "You're all caught up"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-9 shrink-0 gap-1.5 rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 sm:w-auto"
            onClick={() => navigate("/tutor/analytics")}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            View Analytics
          </Button>
        </div>
      </section>

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        liveClass={rescheduleTarget}
        onSuccess={fetchClasses}
      />
    </div>
  );
};

export default MyClasses;
