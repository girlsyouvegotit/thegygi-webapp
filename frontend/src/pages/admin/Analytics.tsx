import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  GraduationCap,
  HeartHandshake,
  FolderTree,
  Video,
  PlayCircle,
  Shield,
  ArrowUpRight,
  BarChart3,
  Activity,
  TrendingUp,
  RefreshCw,
  Award,
  Target,
  Radio,
  CheckCircle2,
  Search,
  Bell,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuthContext";
import { useAdminPath } from "@/hooks/useAdminPath";
import type { adminOverview } from "@/types";
import { cn } from "@/lib/utils";

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

const Analytics = () => {
  const navigate = useNavigate();
  const adminPath = useAdminPath();
  const { user } = useAuth();
  const [overview, setOverview] = useState<adminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/analytics/admin/overview");
      setOverview(data.data.overview as adminOverview);
    } catch (error: unknown) {
      console.error("Failed to load analytics:", error);
      toast.error(getErrorMessage(error, "Failed to load analytics"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const getFirstName = (fullName?: string) => {
    if (!fullName) return "Admin";
    return fullName.split(" ")[0];
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const totalUsers =
    (overview?.totalStudents || 0) +
    (overview?.totalTutors || 0) +
    (overview?.totalMentors || 0) +
    (overview?.totalAdmins || 0);

  const studentPercentage =
    totalUsers > 0
      ? Math.round(((overview?.totalStudents || 0) / totalUsers) * 100)
      : 0;
  const tutorPercentage =
    totalUsers > 0
      ? Math.round(((overview?.totalTutors || 0) / totalUsers) * 100)
      : 0;
  const mentorPercentage =
    totalUsers > 0
      ? Math.round(((overview?.totalMentors || 0) / totalUsers) * 100)
      : 0;
  const adminPercentage =
    totalUsers > 0
      ? Math.round(((overview?.totalAdmins || 0) / totalUsers) * 100)
      : 0;

  const pieData = [
    { name: "Students", value: overview?.totalStudents || 0, color: "#10b981" },
    { name: "Tutors", value: overview?.totalTutors || 0, color: "#3b82f6" },
    { name: "Mentors", value: overview?.totalMentors || 0, color: "#f59e0b" },
    { name: "Admins", value: overview?.totalAdmins || 0, color: "#c147e9" },
  ].filter((item) => item.value > 0);

  const barData = [
    { name: "Students", value: overview?.totalStudents || 0, fill: "#34d399" },
    { name: "Tutors", value: overview?.totalTutors || 0, fill: "#60a5fa" },
    { name: "Mentors", value: overview?.totalMentors || 0, fill: "#fbbf24" },
    { name: "Admins", value: overview?.totalAdmins || 0, fill: "#c147e9" },
    {
      name: "Categories",
      value: overview?.totalCategories || 0,
      fill: "#2dd4bf",
    },
    { name: "Live", value: overview?.liveClasses || 0, fill: "#fb7185" },
    {
      name: "Recordings",
      value: overview?.totalRecordings || 0,
      fill: "#a78bfa",
    },
    {
      name: "Mentorships",
      value: overview?.activeMentorships || 0,
      fill: "#22d3ee",
    },
  ];

  const maxBar = Math.max(...barData.map((d) => d.value), 1);
  let highlightedBar = 0;
  let peakValue = -1;
  barData.forEach((d, i) => {
    if (d.value > peakValue) {
      peakValue = d.value;
      highlightedBar = i;
    }
  });

  const trendData = [
    { day: "Mon", value: 12, height: "h-8" },
    { day: "Tue", value: 18, height: "h-12" },
    { day: "Wed", value: 24, height: "h-16" },
    { day: "Thu", value: 32, height: "h-20" },
    { day: "Fri", value: 28, height: "h-16" },
    { day: "Sat", value: 40, height: "h-24" },
    { day: "Sun", value: 35, height: "h-20" },
  ];

  const contentPulse = [
    {
      label: "Categories",
      value: overview?.totalCategories || 0,
      icon: FolderTree,
      color: "text-teal-600",
      bg: "bg-teal-500/10",
      url: adminPath("categories"),
      status: "Active",
    },
    {
      label: "Live Classes",
      value: overview?.liveClasses || 0,
      icon: Video,
      color: "text-rose-600",
      bg: "bg-rose-500/10",
      url: adminPath("recordings"),
      status: (overview?.liveClasses || 0) > 0 ? "Live" : "Idle",
    },
    {
      label: "Recordings",
      value: overview?.totalRecordings || 0,
      icon: PlayCircle,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
      url: adminPath("recordings"),
      status: "Archived",
    },
    {
      label: "Mentorships",
      value: overview?.activeMentorships || 0,
      icon: HeartHandshake,
      color: "text-cyan-600",
      bg: "bg-cyan-500/10",
      url: adminPath("mentorship"),
      status: "Paired",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative mx-auto w-14 h-14">
            <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <BarChart3 className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
          </div>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] min-w-0 overflow-x-hidden pb-8">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-400">
              GYGI
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              Analytics
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white border border-slate-200/80 shadow-sm">
            {[
              { label: "Overview", active: true },
              { label: "Users", path: adminPath("users") },
              { label: "Categories", path: adminPath("categories") },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => item.path && navigate(item.path)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                  item.active
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => navigate(adminPath("users"))}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:border-slate-300 hover:text-slate-800 shadow-sm"
            aria-label="Search users"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(adminPath("activity-logs"))}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:border-slate-300 hover:text-slate-800 shadow-sm"
            aria-label="Activity"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fetchOverview(true)}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-300 shadow-sm"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", refreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Avatar className="w-10 h-10 border border-slate-200 shadow-sm">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <p className="text-sm text-slate-500 mb-5 sm:mb-6">
        Welcome back,{" "}
        <span className="text-slate-900 font-semibold">
          {getFirstName(user?.name)}
        </span>
        — live platform analytics
      </p>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
        {/* LEFT / MAIN */}
        <div className="xl:col-span-8 flex flex-col gap-4 sm:gap-5 min-w-0">
          {/* Hero metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
            <div className="sm:col-span-6 relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary via-[#b03ad4] to-fuchsia-500 text-white p-5 sm:p-6 shadow-xl shadow-primary/25">
              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/15 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-white/70">
                    Total community
                  </p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold">
                    <TrendingUp className="w-3 h-3" />
                    Growing
                  </span>
                </div>
                <p className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums">
                  {totalUsers.toLocaleString()}
                </p>
                <p className="mt-2 text-xs font-medium text-white/75">
                  Active users across GYGI · {studentPercentage}% students
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(adminPath("users"))}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-black"
                  >
                    Manage users
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(adminPath("categories"))}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-primary text-xs font-bold hover:bg-white/90"
                  >
                    Categories
                  </button>
                </div>
              </div>
            </div>

            <div className="sm:col-span-3 rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-slate-400">Students</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                  +{studentPercentage}%
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                  {(overview?.totalStudents || 0).toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  of platform share
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(adminPath("users?role=student"))}
                className="mt-3 text-[11px] font-semibold text-primary inline-flex items-center gap-1 hover:underline"
              >
                View roster <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="sm:col-span-3 rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-slate-400">
                  Live classes
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold">
                  {(overview?.liveClasses || 0) > 0 ? "On air" : "Idle"}
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                  {overview?.liveClasses || 0}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {overview?.activeMentorships || 0} mentorships active
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(adminPath("recordings"))}
                className="mt-3 text-[11px] font-semibold text-rose-500 inline-flex items-center gap-1 hover:underline"
              >
                Open recordings <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
            <div className="xl:col-span-7 rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-5 sm:p-6 min-w-0">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Platform flow
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All metrics at a glance
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    Live
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchOverview(true)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 24, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(193,71,233,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value}`, "Count"]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[14, 14, 14, 14]}
                      maxBarSize={36}
                    >
                      {barData.map((_entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={
                            index === highlightedBar
                              ? "#c147e9"
                              : "rgba(193,71,233,0.22)"
                          }
                          style={
                            index === highlightedBar
                              ? {
                                  filter:
                                    "drop-shadow(0 6px 12px rgba(193,71,233,0.35))",
                                }
                              : undefined
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {barData[highlightedBar] && (
                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-[11px] font-semibold text-primary">
                  Peak: {barData[highlightedBar].name} ·{" "}
                  {barData[highlightedBar].value.toLocaleString()}
                  <span className="text-emerald-600">
                    {Math.round(
                      (barData[highlightedBar].value / maxBar) * 100,
                    )}
                    %
                  </span>
                </div>
              )}
            </div>

            <div className="xl:col-span-5 rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-5 sm:p-6 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Role split
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      User distribution
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {totalUsers} total
                </span>
              </div>

              <div className="relative h-48 sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} users`,
                        name,
                      ]}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total
                  </p>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">
                    {totalUsers}
                  </p>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {[
                  {
                    name: "Students",
                    pct: studentPercentage,
                    color: "#10b981",
                  },
                  { name: "Tutors", pct: tutorPercentage, color: "#3b82f6" },
                  {
                    name: "Mentors",
                    pct: mentorPercentage,
                    color: "#f59e0b",
                  },
                  { name: "Admins", pct: adminPercentage, color: "#c147e9" },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <span
                      className="w-1.5 h-5 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="flex-1 text-slate-500 font-medium">
                      {row.name}
                    </span>
                    <span className="font-bold tabular-nums text-slate-900">
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content pulse */}
          <div className="rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Content pulse
                </h3>
                <p className="text-[11px] text-slate-400">
                  Platform content overview
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(adminPath("categories"))}
                className="text-[11px] font-semibold text-slate-400 hover:text-primary inline-flex items-center gap-1"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {contentPulse.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.url)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAFAFC] border border-slate-100 hover:border-primary/20 hover:bg-primary/[0.03] transition-colors text-left min-w-0"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                      item.bg,
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", item.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400">GYGI content</p>
                  </div>
                  <span
                    className={cn(
                      "hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold",
                      item.status === "Live"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-emerald-50 text-emerald-600",
                    )}
                  >
                    {item.status}
                  </span>
                  <span className="text-base font-black text-slate-900 tabular-nums shrink-0">
                    {item.value}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Weekly + efficiency */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5">
            <div className="sm:col-span-7 rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Weekly activity
                  </h4>
                </div>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-32 flex items-end justify-between gap-2">
                {trendData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                  >
                    <div
                      className={cn(
                        "w-full rounded-full transition-all",
                        idx === 5
                          ? "bg-gradient-to-t from-primary to-fuchsia-400 shadow-lg shadow-primary/30"
                          : "bg-slate-200 group-hover:bg-slate-300",
                        item.height,
                      )}
                    />
                    <span className="text-[9px] text-slate-400 font-mono">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-5 relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary via-[#b03ad4] to-fuchsia-600 text-white p-5 sm:p-6 shadow-xl shadow-primary/20">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex flex-col h-full min-h-[160px]">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white/90">
                    Platform efficiency
                  </h4>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="my-4">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h2 className="text-4xl sm:text-5xl font-black">96%</h2>
                    <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                      Optimal
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80">
                    Engagement across all active categories
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-white/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-[11px] font-semibold text-white/90">
                    All systems operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-4 flex flex-col gap-4 sm:gap-5 min-w-0">
          <section className="rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Role cards</h3>
                <p className="text-[11px] text-slate-400">User metrics</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(adminPath("users"))}
                className="h-8 px-3 rounded-full bg-slate-900 text-white text-[11px] font-bold hover:bg-black"
              >
                Manage +
              </button>
            </div>

            <div className="relative h-[220px] mb-2">
              {[
                {
                  label: "Students",
                  value: overview?.totalStudents || 0,
                  pct: studentPercentage,
                  gradient: "from-orange-400 via-pink-500 to-primary",
                  top: "0%",
                  z: 1,
                  url: adminPath("users?role=student"),
                },
                {
                  label: "Tutors",
                  value: overview?.totalTutors || 0,
                  pct: tutorPercentage,
                  gradient: "from-cyan-400 via-emerald-400 to-lime-400",
                  top: "18%",
                  z: 2,
                  url: adminPath("users?role=tutor"),
                },
                {
                  label: "Mentors",
                  value: overview?.totalMentors || 0,
                  pct: mentorPercentage,
                  gradient: "from-indigo-400 via-primary to-fuchsia-400",
                  top: "36%",
                  z: 3,
                  url: adminPath("users?role=mentor"),
                },
              ].map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => navigate(card.url)}
                  className={cn(
                    "absolute left-0 right-0 h-[130px] rounded-[1.35rem] bg-gradient-to-br p-4 text-left shadow-xl transition-transform hover:-translate-y-1",
                    card.gradient,
                  )}
                  style={{ top: card.top, zIndex: card.z }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {card.label}
                      </p>
                      <p className="text-2xl font-black text-white tabular-nums mt-1">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold text-white backdrop-blur-sm">
                      {card.pct}%
                    </span>
                  </div>
                  <p className="absolute bottom-4 left-4 right-4 text-[10px] font-semibold text-white/80 truncate">
                    GYGI · {card.label} roster
                  </p>
                </button>
              ))}

              <div className="absolute inset-x-3 bottom-0 h-16 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-between px-4 z-10">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Admins
                  </p>
                  <p className="text-sm font-black text-slate-900 tabular-nums">
                    {overview?.totalAdmins || 0} · {adminPercentage}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(adminPath("users?role=admin"))}
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-5 sm:p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900">
                  Live activity
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Monitor
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  icon: Radio,
                  label: "Live Classes",
                  value: overview?.liveClasses || 0,
                  detail: "Currently streaming",
                  color: "text-rose-500",
                  bg: "bg-rose-500/10",
                },
                {
                  icon: HeartHandshake,
                  label: "Active Mentorships",
                  value: overview?.activeMentorships || 0,
                  detail: "Ongoing pairs",
                  color: "text-teal-500",
                  bg: "bg-teal-500/10",
                },
                {
                  icon: PlayCircle,
                  label: "Recordings",
                  value: overview?.totalRecordings || 0,
                  detail: "Class archives",
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAFAFC] border border-slate-100"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      row.bg,
                    )}
                  >
                    <row.icon className={cn("w-4 h-4", row.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {row.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{row.detail}</p>
                  </div>
                  <span className="text-sm font-black text-slate-900 tabular-nums">
                    {row.value}
                  </span>
                  <MoreHorizontal className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-400">User metrics</p>
                <button
                  type="button"
                  onClick={() => navigate(adminPath("users"))}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Manage
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Students",
                    value: overview?.totalStudents || 0,
                    icon: Users,
                    url: adminPath("users?role=student"),
                  },
                  {
                    label: "Tutors",
                    value: overview?.totalTutors || 0,
                    icon: GraduationCap,
                    url: adminPath("users?role=tutor"),
                  },
                  {
                    label: "Mentors",
                    value: overview?.totalMentors || 0,
                    icon: HeartHandshake,
                    url: adminPath("users?role=mentor"),
                  },
                  {
                    label: "Admins",
                    value: overview?.totalAdmins || 0,
                    icon: Shield,
                    url: adminPath("users?role=admin"),
                  },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => navigate(stat.url)}
                    className="rounded-2xl bg-[#FAFAFC] border border-slate-100 p-3 text-left hover:border-primary/25 hover:bg-primary/[0.03] transition-colors"
                  >
                    <stat.icon className="w-3.5 h-3.5 text-slate-400 mb-1.5" />
                    <p className="text-lg font-black text-slate-900 tabular-nums leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      {stat.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-slate-600">
                  Platform health
                </span>
                <span className="ml-auto text-[11px] font-bold text-emerald-600">
                  100%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              </div>
              <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Status: Active monitor · Live
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
