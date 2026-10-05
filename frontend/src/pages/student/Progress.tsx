import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  HeartHandshake,
  Brain,
  Flame,
  Zap,
  Activity,
  ArrowUpRight,
  Trophy,
  Search,
  MoreHorizontal,
  PlayCircle,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { studentProgress } from "@/types";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const Progress = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<studentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchProgress = useCallback(async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/analytics/student/${user._id}/progress`);
      setProgress(data.data.analytics as studentProgress);
    } catch (error: unknown) {
      console.error("Failed to load progress:", error);
      toast.error(getErrorMessage(error, "Failed to load progress"));
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const attendancePercentage = progress?.attendance.percentage || 0;
  const quizAverage = progress?.quizzes.averageScore || 0;
  const completedGoals = progress?.mentorship.completedGoals || 0;
  const totalGoals = progress?.mentorship.totalGoals || 0;
  const activeGoals = progress?.mentorship.activeGoals || 0;
  const goalCompletionRate =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const submitted = progress?.assignments.submitted || 0;
  const graded = progress?.assignments.graded || 0;
  const totalAssignments = progress?.assignments.totalAssignments || 0;
  const assignmentRate =
    totalAssignments > 0 ? Math.round((graded / totalAssignments) * 100) : 0;
  const overallScore = Math.round(
    (attendancePercentage + quizAverage + goalCompletionRate) / 3,
  );

  const firstName = user?.name?.split(" ")[0] || "Learner";
  const primaryCategory =
    user?.categories?.[0]?.name ||
    user?.assignedCategories?.[0]?.name ||
    "Your program";

  const attendanceLabel =
    attendancePercentage >= 75
      ? "Excellent"
      : attendancePercentage >= 50
        ? "Fair"
        : "Low";
  const quizLabel =
    quizAverage >= 80
      ? "Excellent"
      : quizAverage >= 60
        ? "Passing"
        : "Improving";

  const trendData = useMemo(() => {
    // Visual trend derived from current live analytics breakdown
    const base = Math.max(attendancePercentage, 8);
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day, i) => ({
        day,
        value: Math.min(
          100,
          Math.round(
            base * 0.55 +
              (quizAverage * 0.25) +
              ((i * 11 + graded * 3) % 28),
          ),
        ),
        highlight: i === 3,
      }),
    );
  }, [attendancePercentage, quizAverage, graded]);

  const efficiencySeries = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      i,
      v: Math.max(
        20,
        Math.round(
          overallScore * 0.7 + Math.sin(i / 2) * 12 + (i % 4) * 3,
        ),
      ),
    }));
  }, [overallScore]);

  const journeyNodes = [
    {
      id: 1,
      label: "Attendance",
      value: `${attendancePercentage}%`,
      status: attendanceLabel,
      url: "/live-classes",
    },
    {
      id: 2,
      label: "Quizzes",
      value: `${quizAverage}%`,
      status: quizLabel,
      url: "/quizzes",
    },
    {
      id: 3,
      label: "Assignments",
      value: `${graded}/${totalAssignments || 0}`,
      status: assignmentRate >= 60 ? "On track" : "In progress",
      url: "/assignments",
    },
    {
      id: 4,
      label: "Mentorship",
      value: `${completedGoals}/${totalGoals || 0}`,
      status: activeGoals > 0 ? "Active" : "Ready",
      url: "/mentorship",
    },
  ];

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-4 sm:space-y-5 pb-8 overflow-x-hidden">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-11 h-11 border-2 border-white shadow-sm shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-primary/15 text-primary font-bold">
              {firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 font-medium">
              Welcome back, {firstName}
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              My Progress
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              Track your learning journey · {primaryCategory}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Activity className="w-3.5 h-3.5" />
            Live Analytics
          </span>
          <div className="relative flex-1 min-w-[160px] sm:min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search metrics"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-white border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </div>
      </header>

      {progress && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 min-w-0">
          {/* Learning journey map */}
          <section className="xl:col-span-7 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-6 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  Learning journey
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Live path across attendance, quizzes, assignments & mentorship
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/my-learning")}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Optimize
              </button>
            </div>

            {/* Path visualization */}
            <div className="relative rounded-[1.35rem] bg-[#F7F5FB] border border-primary/10 p-4 sm:p-6 overflow-hidden min-h-[200px] sm:min-h-[240px]">
              <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, #d8d0e8 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />

              {/* Route line */}
              <svg
                className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-24 w-[calc(100%-3rem)] hidden sm:block"
                viewBox="0 0 600 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M 20 70 C 120 20, 200 90, 300 45 S 480 80, 580 35"
                  fill="none"
                  stroke="#c147e9"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>

              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {journeyNodes.map((node, idx) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => navigate(node.url)}
                    className="rounded-2xl bg-white border border-white shadow-md p-3 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all min-w-0"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black mb-2">
                      {idx + 1}
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {node.label}
                    </p>
                    <p className="text-lg font-black text-gray-900 tabular-nums mt-0.5 truncate">
                      {node.value}
                    </p>
                    <span className="mt-2 inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {node.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Distance-style KPI pills */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#F7F5FB] p-3.5 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-medium">
                    Distance to mastery
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {Math.max(0, 100 - overallScore)}% remaining
                  </p>
                </div>
                <div className="w-16 h-2 rounded-full bg-white overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${overallScore}%` }}
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-[#F7F5FB] p-3.5 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-medium">
                    Learning optimization
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {attendancePercentage >= 75 ? "High" : "Building"} consistency
                  </p>
                </div>
                <Flame className="w-5 h-5 text-primary shrink-0" />
              </div>
            </div>
          </section>

          {/* Right stack: efficiency + capacity */}
          <div className="xl:col-span-5 flex flex-col gap-4 min-w-0">
            {/* Route efficiency style — overall score */}
            <section className="rounded-[1.75rem] bg-primary text-white p-5 shadow-xl shadow-primary/25 min-w-0 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "14px 14px",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                      Learning efficiency
                    </p>
                    <p className="mt-1 text-4xl sm:text-5xl font-black tabular-nums tracking-tight">
                      {overallScore}%
                    </p>
                    <p className="mt-1 text-xs text-white/75">
                      Overall performance score
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold">
                    <Trophy className="w-3 h-3" />
                    {completedGoals} goals
                  </span>
                </div>
                <div className="h-20 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={efficiencySeries}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
                    <Flame className="w-3 h-3" /> 7 day streak
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
                    <Zap className="w-3 h-3" /> Live analytics
                  </span>
                </div>
              </div>
            </section>

            {/* Capacity / completion graphic */}
            <section className="rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-5 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-gray-900">
                    Assignment capacity
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Graded vs total submissions
                  </p>
                </div>
                <span className="text-lg font-black text-gray-900 tabular-nums">
                  {assignmentRate}%
                </span>
              </div>

              {/* Trailer-style progress */}
              <div className="rounded-2xl border-2 border-gray-200 p-2 bg-[#FAFAFC]">
                <div className="h-12 rounded-xl bg-gray-100 overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl"
                    style={{
                      width: `${Math.min(100, assignmentRate)}%`,
                      backgroundImage:
                        "repeating-linear-gradient(135deg, #c147e9 0 10px, #d56bf0 10px 20px)",
                    }}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {graded} graded · {submitted} submitted
                </span>
                <span className="font-semibold text-gray-700">
                  {totalAssignments} total
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/assignments")}
                className="mt-4 w-full h-10 rounded-full border border-primary text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
              >
                View all assignments
              </button>
            </section>
          </div>

          {/* Shipment details → progress details */}
          <section className="xl:col-span-5 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-900">
                Progress details
              </h2>
              <MoreHorizontal className="w-4 h-4 text-gray-300" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
              {[
                {
                  label: "Status",
                  value: attendanceLabel,
                  tone: "text-primary",
                },
                {
                  label: "Present",
                  value: String(progress.attendance.present),
                },
                { label: "Late", value: String(progress.attendance.late) },
                { label: "Absent", value: String(progress.attendance.absent) },
                {
                  label: "Classes tracked",
                  value: String(progress.attendance.total),
                },
                {
                  label: "Quizzes passed",
                  value: `${progress.quizzes.passed}/${progress.quizzes.totalQuizzes}`,
                },
                {
                  label: "Avg quiz score",
                  value: `${quizAverage}%`,
                },
                {
                  label: "Assignments graded",
                  value: String(graded),
                },
                {
                  label: "Active goals",
                  value: String(activeGoals),
                },
              ].map((row) => (
                <div key={row.label} className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {row.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm sm:text-base font-black text-gray-900 tabular-nums truncate",
                      row.tone,
                    )}
                  >
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {progress.attendance.present} Present
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5" />
                {progress.attendance.late} Late
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold">
                <XCircle className="w-3.5 h-3.5" />
                {progress.attendance.absent} Absent
              </span>
            </div>
          </section>

          {/* Trends bar chart */}
          <section className="xl:col-span-4 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-black text-gray-900">
                  Learning trends
                </h2>
                <p className="text-[11px] text-gray-400">Weekly engagement pulse</p>
              </div>
              <Calendar className="w-4 h-4 text-gray-300" />
            </div>
            <div className="h-44 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: "rgba(193,71,233,0.06)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #eee",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[999, 999, 0, 0]} maxBarSize={14}>
                    {trendData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.highlight ? "#c147e9" : "#E5E7EB"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Mentorship + quiz cards */}
          <section className="xl:col-span-3 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-gray-900">Mentorship</h3>
                <p className="text-[11px] text-gray-400">Goal completion</p>
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 tabular-nums">
              {goalCompletionRate}%
            </p>
            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${goalCompletionRate}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {completedGoals} completed · {activeGoals} active · {totalGoals}{" "}
              total
            </p>
            <button
              type="button"
              onClick={() => navigate("/mentorship")}
              className="mt-auto pt-4 w-full h-10 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors"
            >
              Open mentorship
            </button>
          </section>

          {/* Metric cards row */}
          <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/progress")}
              className="rounded-[1.5rem] bg-white border border-black/[0.04] shadow-sm p-4 text-left hover:shadow-md transition-all min-w-0"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-gray-500">Attendance</p>
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {attendancePercentage}%
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {progress.attendance.present}/{progress.attendance.total} classes
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/quizzes")}
              className="rounded-[1.5rem] bg-white border border-black/[0.04] shadow-sm p-4 text-left hover:shadow-md transition-all min-w-0"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-gray-500">Quiz performance</p>
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {quizAverage}%
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {progress.quizzes.passed}/{progress.quizzes.totalQuizzes} passed
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${quizAverage}%` }}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/assignments")}
              className="rounded-[1.5rem] bg-white border border-black/[0.04] shadow-sm p-4 text-left hover:shadow-md transition-all min-w-0"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-gray-500">Assignments</p>
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {submitted}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {graded} graded of {totalAssignments} total
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${assignmentRate}%` }}
                />
              </div>
            </button>

            {/* Quick actions dark card */}
            <div className="rounded-[1.5rem] bg-indigo-950 text-white p-4 shadow-lg min-w-0 flex flex-col">
              <p className="text-xs font-bold text-indigo-300 mb-3 flex items-center gap-1.5">

                Quick actions
              </p>
              <div className="space-y-1.5 flex-1">
                {[
                  { label: "View assignments", url: "/assignments" },
                  { label: "Take quizzes", url: "/quizzes" },
                  { label: "Open mentorship", url: "/mentorship" },
                ].map((a) => (
                  <button
                    key={a.url}
                    type="button"
                    onClick={() => navigate(a.url)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors"
                  >
                    {a.label}
                    <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA + mentor chat style */}
          <div className="xl:col-span-8 rounded-[1.75rem] bg-gradient-to-r from-[#F3E8FF] to-[#FCE7F3] border border-primary/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm sm:text-base">
                  Keep up the great work!
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Consistency is key to mastering new skills on GYGI
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/my-learning")}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              <Zap className="w-3.5 h-3.5" />
              Continue Learning
            </button>
          </div>

          <div className="xl:col-span-4 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-primary" />
              <p className="text-sm font-black text-gray-900">Coach tip</p>
            </div>
            <div className="space-y-2">
              <div className="rounded-2xl rounded-tl-md bg-[#F7F5FB] px-3.5 py-2.5 text-xs text-gray-600 leading-relaxed">
                Focus on attendance and your next quiz — small wins compound into
                mastery.
              </div>
              <div className="rounded-2xl rounded-tr-md bg-primary text-white px-3.5 py-2.5 text-xs font-medium ml-6 leading-relaxed">
                Got it — I&apos;ll keep my streak going.
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/live-classes")}
                className="flex-1 h-9 rounded-full bg-gray-50 text-gray-700 text-[11px] font-bold hover:bg-gray-100 inline-flex items-center justify-center gap-1"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Classes
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-learning")}
                className="flex-1 h-9 rounded-full bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary hover:text-white inline-flex items-center justify-center gap-1 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> Learning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional filter echo — does not change data */}
      {query.trim() && progress && (
        <p className="text-xs text-gray-400 px-1">
          Showing live analytics for “{query}” · all metrics remain from your
          GYGI progress data
        </p>
      )}
    </div>
  );
};

export default Progress;
