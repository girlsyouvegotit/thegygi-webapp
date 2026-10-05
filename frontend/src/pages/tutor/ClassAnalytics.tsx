import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Radio,
  TrendingUp,
  Users,
  Video,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import type { attendance, liveClass } from "@/types";

const STATUS_META: Record<
  string,
  { label: string; chip: string; dot: string }
> = {
  scheduled: {
    label: "Scheduled",
    chip: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  live: {
    label: "Live",
    chip: "bg-rose-500/10 text-rose-600",
    dot: "bg-rose-500",
  },
  ended: {
    label: "Ended",
    chip: "bg-slate-500/10 text-slate-600",
    dot: "bg-slate-400",
  },
  processing: {
    label: "Processing",
    chip: "bg-amber-500/10 text-amber-700",
    dot: "bg-amber-500",
  },
  recorded: {
    label: "Recorded",
    chip: "bg-emerald-500/10 text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    chip: "bg-rose-400/10 text-rose-500",
    dot: "bg-rose-400",
  },
};

const ATTENDANCE_STATUS: Record<
  string,
  { label: string; chip: string; bar: string }
> = {
  present: {
    label: "Present",
    chip: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  late: {
    label: "Late",
    chip: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
  },
  absent: {
    label: "Absent",
    chip: "bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
  },
  excused: {
    label: "Excused",
    chip: "bg-slate-100 text-slate-600",
    bar: "bg-slate-400",
  },
};

type ChartPoint = {
  label: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
};

type EngagementPoint = {
  label: string;
  score: number;
  average: number;
};

const ClassAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [liveClass, setLiveClass] = useState<liveClass | null>(null);
  const [records, setRecords] = useState<attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [classRes, attendanceRes] = await Promise.all([
          api.get(`/classes/${id}`),
          api.get(`/attendance/class/${id}`),
        ]);
        if (cancelled) return;
        setLiveClass(classRes.data.data.class as liveClass);
        setRecords(
          (attendanceRes.data.data.attendance as attendance[]) || [],
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load analytics:", err);
          setError("Could not load class analytics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const attendanceData = useMemo<ChartPoint[]>(() => {
    const map = new Map<string, ChartPoint>();
    for (const record of records) {
      const dateKey = format(new Date(record.joinedAt), "MMM d");
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          label: dateKey,
          present: 0,
          late: 0,
          absent: 0,
          excused: 0,
        });
      }
      const entry = map.get(dateKey)!;
      const key = record.status as keyof Omit<ChartPoint, "label">;
      if (key in entry) entry[key] += 1;
    }
    return Array.from(map.values());
  }, [records]);

  const totals = useMemo(() => {
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const excused = records.filter((r) => r.status === "excused").length;
    const total = records.length || 1;
    const avgPct =
      records.length === 0
        ? 0
        : Math.round(
            records.reduce((sum, r) => sum + (r.attendancePercentage || 0), 0) /
              records.length,
          );
    const presentRate = Math.round(((present + late) / total) * 100);
    return { present, late, absent, excused, avgPct, presentRate, total: records.length };
  }, [records]);

  const engagementData = useMemo<EngagementPoint[]>(() => {
    const byStudent = new Map<
      string,
      { name: string; scores: number[] }
    >();
    for (const record of records) {
      const student = record.student;
      const sid =
        typeof student === "object" && student?._id
          ? student._id
          : String(student || "");
      if (!sid) continue;
      const name =
        typeof student === "object" && student?.name
          ? student.name
          : "Student";
      if (!byStudent.has(sid)) byStudent.set(sid, { name, scores: [] });
      byStudent.get(sid)!.scores.push(record.attendancePercentage || 0);
    }
    const avg = totals.avgPct;
    return Array.from(byStudent.values())
      .map((s) => ({
        label: s.name.split(" ")[0] || s.name,
        score: Math.round(
          s.scores.reduce((a, b) => a + b, 0) / Math.max(s.scores.length, 1),
        ),
        average: avg,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [records, totals.avgPct]);

  const roster = useMemo(() => {
    return [...records].sort(
      (a, b) =>
        (b.attendancePercentage || 0) - (a.attendancePercentage || 0),
    );
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <BarChart3 className="absolute inset-0 m-auto h-5 w-5 animate-pulse text-primary" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading class analytics...
          </p>
        </div>
      </div>
    );
  }

  const statusMeta =
    STATUS_META[liveClass?.status || ""] || STATUS_META.ended;

  const kpis = [
    {
      label: "Attendance rate",
      value: `${totals.presentRate}%`,
      icon: TrendingUp,
      chip: "bg-primary/10 text-primary",
    },
    {
      label: "Avg engagement",
      value: `${totals.avgPct}%`,
      icon: Radio,
      chip: "bg-violet-100 text-violet-700",
    },
    {
      label: "Records",
      value: totals.total,
      icon: Users,
      chip: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Duration",
      value: `${liveClass?.duration || 0}m`,
      icon: Clock,
      chip: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1680px] pb-10 pt-1">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mt-0.5 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Class insights
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  statusMeta.chip,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} />
                {statusMeta.label}
              </span>
            </div>
            <h1 className="mt-2 truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {liveClass?.title || "Class Analytics"}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              {liveClass?.scheduledDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(liveClass.scheduledDate), "EEE, MMM d · h:mm a")}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Cap {liveClass?.maxParticipants || 0}
              </span>
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

      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

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
        {/* Attendance chart */}
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Attendance overview
              </h2>
              <p className="text-[11px] text-slate-500">
                Present, late, and absent by session day
              </p>
            </div>
          </div>

          {attendanceData.length === 0 ? (
            <div className="rounded-2xl bg-[#FAFBFD] py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Users className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                No attendance yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Records appear after the class session ends
              </p>
            </div>
          ) : (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="present"
                    name="Present"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="late"
                    name="Late"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="Absent"
                    fill="#F43F5E"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Mix + class meta */}
        <section className="rounded-3xl border border-slate-100 bg-[#FAFBFD] p-5 shadow-sm sm:p-6 lg:col-span-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Attendance mix
              </h2>
              <p className="text-[11px] text-slate-500">
                How students showed up
              </p>
            </div>
          </div>

          <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-slate-200/70">
            {(
              [
                ["present", totals.present],
                ["late", totals.late],
                ["absent", totals.absent],
                ["excused", totals.excused],
              ] as const
            ).map(([key, count]) =>
              count > 0 ? (
                <div
                  key={key}
                  className={cn("h-full", ATTENDANCE_STATUS[key].bar)}
                  style={{
                    width: `${(count / Math.max(totals.total, 1)) * 100}%`,
                  }}
                  title={`${ATTENDANCE_STATUS[key].label}: ${count}`}
                />
              ) : null,
            )}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2.5">
            {(
              [
                ["present", totals.present],
                ["late", totals.late],
                ["absent", totals.absent],
                ["excused", totals.excused],
              ] as const
            ).map(([key, count]) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-100 bg-white p-3"
              >
                <p className="text-lg font-black tabular-nums text-slate-900">
                  {count}
                </p>
                <p className="text-[10px] font-semibold text-slate-500">
                  {ATTENDANCE_STATUS[key].label}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">Max seats</span>
              <span className="font-bold text-slate-900">
                {liveClass?.maxParticipants || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">Duration</span>
              <span className="font-bold text-slate-900">
                {liveClass?.duration || 0} mins
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">Status</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  statusMeta.chip,
                )}
              >
                {statusMeta.label}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Engagement chart */}
      <section className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Student engagement
            </h2>
            <p className="text-[11px] text-slate-500">
              Attendance % vs class average ({totals.avgPct}%)
            </p>
          </div>
        </div>

        {engagementData.length === 0 ? (
          <div className="rounded-2xl bg-[#FAFBFD] py-10 text-center text-sm text-slate-500">
            Engagement scores appear once attendance is recorded
          </div>
        ) : (
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} barGap={6}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#F8FAFC" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                  iconType="circle"
                />
                <Bar
                  dataKey="score"
                  name="Engagement"
                  fill="#c147e9"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="average"
                  name="Class avg"
                  fill="#CBD5E1"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Roster */}
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Attendance roster
              </h2>
              <p className="text-[11px] text-slate-500">
                {roster.length} student record{roster.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {roster.length === 0 ? (
          <div className="rounded-2xl bg-[#FAFBFD] py-12 text-center">
            <p className="text-sm font-bold text-slate-700">No students yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Attendance rows will list here after the live session
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-100 md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAFBFD] text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((row) => {
                    const student =
                      typeof row.student === "object" ? row.student : null;
                    const meta =
                      ATTENDANCE_STATUS[row.status] || ATTENDANCE_STATUS.absent;
                    const pct = row.attendancePercentage || 0;
                    return (
                      <tr key={row._id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={student?.avatar} />
                              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                {student?.name?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {student?.name || "Student"}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {student?.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold",
                              meta.chip,
                            )}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">
                          {row.joinedAt
                            ? format(new Date(row.joinedAt), "MMM d · h:mm a")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-slate-700">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2.5 md:hidden">
              {roster.map((row) => {
                const student =
                  typeof row.student === "object" ? row.student : null;
                const meta =
                  ATTENDANCE_STATUS[row.status] || ATTENDANCE_STATUS.absent;
                const pct = row.attendancePercentage || 0;
                return (
                  <div
                    key={row._id}
                    className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student?.avatar} />
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {student?.name?.charAt(0) || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {student?.name || "Student"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {row.joinedAt
                            ? format(new Date(row.joinedAt), "MMM d · h:mm a")
                            : "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          meta.chip,
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums text-slate-700">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
      </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ClassAnalytics;
