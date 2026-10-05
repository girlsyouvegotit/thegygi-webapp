import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Clock,
  FileQuestion,
  Radio,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import type { liveClass, tutorAnalytics } from "@/types";

const STATUS_META: Record<
  string,
  { label: string; barClass: string; textClass: string; bgClass: string }
> = {
  scheduled: {
    label: "Scheduled",
    barClass: "bg-primary",
    textClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  live: {
    label: "Live",
    barClass: "bg-rose-500",
    textClass: "text-rose-600",
    bgClass: "bg-rose-500/10",
  },
  ended: {
    label: "Ended",
    barClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-500/10",
  },
  processing: {
    label: "Processing",
    barClass: "bg-amber-500",
    textClass: "text-amber-600",
    bgClass: "bg-amber-500/10",
  },
  recorded: {
    label: "Recorded",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
    bgClass: "bg-emerald-500/10",
  },
  cancelled: {
    label: "Cancelled",
    barClass: "bg-rose-400",
    textClass: "text-rose-500",
    bgClass: "bg-rose-500/10",
  },
};

const TutorAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<tutorAnalytics | null>(null);
  const [classes, setClasses] = useState<liveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          api.get(`/analytics/tutor/${user._id}`),
          api.get("/classes"),
        ]);
        if (cancelled) return;
        setAnalytics(aRes.data.data.analytics as tutorAnalytics);
        setClasses((cRes.data.data.classes as liveClass[]) || []);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load analytics:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const statusCounts = (() => {
    const map: Record<string, number> = {};
    for (const c of classes) {
      map[c.status] = (map[c.status] || 0) + 1;
    }
    return map;
  })();

  const totalForBar = classes.length || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <BarChart3 className="absolute inset-0 m-auto h-5 w-5 animate-pulse text-primary" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Classes",
      value: analytics?.totalClasses ?? 0,
      icon: Video,
      chip: "bg-violet-100 text-violet-600",
    },
    {
      label: "Students",
      value: analytics?.totalStudents ?? 0,
      icon: Users,
      chip: "bg-primary/10 text-primary",
    },
    {
      label: "Avg Attendance",
      value: `${analytics?.averageAttendance ?? 0}%`,
      icon: TrendingUp,
      chip: "bg-amber-100 text-amber-700",
    },
    {
      label: "Avg Quiz Score",
      value: `${analytics?.averageQuizScore ?? 0}%`,
      icon: FileQuestion,
      chip: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1680px] pb-10 pt-1">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tutor/dashboard")}
            className="mt-0.5 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Insights
            </span>
            <h1 className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Teaching Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              How your classes, students, and assessments are performing
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-10 gap-2 self-start rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 lg:self-auto"
          onClick={() => navigate("/tutor/classes")}
        >
          <Video className="h-3.5 w-3.5" />
          My Classes
        </Button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
          >
            <div
              className={cn(
                "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl",
                kpi.chip,
              )}
            >
              <kpi.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black tabular-nums tracking-tight text-slate-900 sm:text-3xl">
              {kpi.value}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-12 lg:gap-6">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Class status breakdown
              </h2>
              <p className="text-[11px] text-slate-500">
                Distribution across {classes.length} classes
              </p>
            </div>
          </div>

          {classes.length === 0 ? (
            <div className="rounded-2xl bg-[#FAFBFD] py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Video className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">No classes yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Schedule your first class to see analytics here
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div
                    key={status}
                    className={cn(
                      "h-full transition-all",
                      STATUS_META[status]?.barClass || "bg-slate-300",
                    )}
                    style={{ width: `${(count / totalForBar) * 100}%` }}
                    title={`${STATUS_META[status]?.label || status}: ${count}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const meta = STATUS_META[status] || {
                    label: status,
                    barClass: "bg-slate-400",
                    textClass: "text-slate-600",
                    bgClass: "bg-slate-500/10",
                  };
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3"
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          meta.barClass,
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black leading-tight text-slate-900">
                          {count}
                        </p>
                        <p className="truncate text-[10px] font-medium text-slate-500">
                          {meta.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-[#FAFBFD] p-5 shadow-sm sm:p-6 lg:col-span-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Performance health
              </h2>
              <p className="text-[11px] text-slate-500">
                How your students are engaging
              </p>
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Average attendance
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800">
                  {analytics?.averageAttendance ?? 0}%
                </span>
              </div>
              <Progress
                value={analytics?.averageAttendance ?? 0}
                className="h-2 bg-slate-100 [&>div]:bg-amber-400"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Average quiz score
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                  {analytics?.averageQuizScore ?? 0}%
                </span>
              </div>
              <Progress
                value={analytics?.averageQuizScore ?? 0}
                className="h-2 bg-slate-100 [&>div]:bg-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px]">
              <span className="font-medium text-slate-500">Total recordings</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {analytics?.totalRecordings ?? 0}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">All classes</h2>
              <p className="text-[11px] text-slate-500">
                Your complete class history
              </p>
            </div>
          </div>
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:inline">
            {classes.length} total
          </span>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl bg-[#FAFBFD] py-10 text-center">
            <p className="text-sm font-bold text-slate-700">
              No classes scheduled
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {classes.map((cls) => {
              const meta = STATUS_META[cls.status] || {
                label: cls.status,
                barClass: "bg-slate-400",
                textClass: "text-slate-600",
                bgClass: "bg-slate-500/10",
              };
              return (
                <li key={cls._id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/tutor/classes/${cls._id}/analytics`)
                    }
                    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3 text-left transition hover:border-primary/20 hover:bg-white hover:shadow-sm"
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        meta.bgClass,
                      )}
                    >
                      <Video className={cn("h-4 w-4", meta.textClass)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {cls.title}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            meta.bgClass,
                            meta.textClass,
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              meta.barClass,
                            )}
                          />
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {new Date(cls.scheduledDate).toLocaleString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        <span className="mx-1.5 text-slate-300">•</span>
                        {cls.duration} min
                        <span className="mx-1.5 text-slate-300">•</span>
                        {cls.category?.name}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TutorAnalytics;
