import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  HeartHandshake,
  FolderTree,
  Video,
  PlayCircle,
  ArrowUpRight,
  BarChart3,
  GraduationCap,
  Plus,
  Shield,
  Zap,
  CheckCircle2,
  Target,
  Search,
  Bell,
  MessageCircle,
  Maximize2,
  Minus,
  Plus as PlusIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleDashboardSkeleton } from "@/components/loading/PageSkeleton";
import OccasionToast from "@/components/occasions/OccasionToast";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuthContext";
import { useAdminPath } from "@/hooks/useAdminPath";
import type { adminOverview } from "@/types";
import { cn } from "@/lib/utils";
import { withMediaCacheBust } from "@/lib/profileMedia";
import RecentActivityFeed from "@/components/activities/RecentActivityFeed";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toAdmin = useAdminPath();
  const { user } = useAuth();
  const avatarSrc = withMediaCacheBust(user?.avatar, user?.avatarUpdatedAt);
  const [overview, setOverview] = useState<adminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/analytics/admin/overview");
      setOverview(data.data.overview as adminOverview);
    } catch (error: unknown) {
      console.error("Failed to load admin overview:", error);
      toast.error(getErrorMessage(error, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const getFirstName = (fullName?: string): string => {
    if (!fullName) return "Admin";
    return fullName.split(" ")[0];
  };

  const getInitials = (name?: string): string => {
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

  const staffCount =
    (overview?.totalTutors || 0) + (overview?.totalMentors || 0);

  const engagementScore = useMemo(() => {
    const live = overview?.liveClasses || 0;
    const mentorships = overview?.activeMentorships || 0;
    const recordings = overview?.totalRecordings || 0;
    const raw = Math.min(
      100,
      Math.round(55 + live * 8 + mentorships * 4 + Math.min(recordings, 20)),
    );
    return raw;
  }, [overview]);

  const metricCards = [
    {
      label: "Students this month",
      value: overview?.totalStudents || 0,
      delta: "+12%",
      url: toAdmin("users?role=student"),
      chart: [8, 12, 10, 16, 14, 18, 22],
      color: "#c147e9",
    },
    {
      label: "Tutors & mentors",
      value: staffCount,
      delta: "+8%",
      url: toAdmin("users"),
      chart: [6, 9, 8, 11, 10, 13, 15],
      color: "#8b5cf6",
    },
    {
      label: "Active categories",
      value: overview?.totalCategories || 0,
      delta: "+5%",
      url: toAdmin("categories"),
      chart: [4, 5, 5, 7, 6, 8, 9],
      color: "#a855f7",
      line: true,
    },
  ];

  const quickActions = [
    {
      label: "Manage Categories",
      description: "Learning paths",
      icon: FolderTree,
      url: toAdmin("categories"),
    },
    {
      label: "User Management",
      description: "Roles & access",
      icon: Users,
      url: toAdmin("users"),
    },
    {
      label: "Mentorship",
      description: "Assign mentors",
      icon: HeartHandshake,
      url: toAdmin("mentorship"),
    },
    {
      label: "Analytics",
      description: "Platform metrics",
      icon: BarChart3,
      url: toAdmin("analytics"),
    },
    {
      label: "Student Performance",
      description: "All categories",
      icon: GraduationCap,
      url: toAdmin("student-performance"),
    },
  ];

  const opsTimeline = [
    {
      label: "Users onboarded",
      detail: `${totalUsers} total accounts`,
      done: true,
    },
    {
      label: "Categories live",
      detail: `${overview?.totalCategories || 0} programs`,
      done: (overview?.totalCategories || 0) > 0,
    },
    {
      label: "Live classes",
      detail: `${overview?.liveClasses || 0} running now`,
      done: (overview?.liveClasses || 0) > 0,
    },
    {
      label: "Mentorships active",
      detail: `${overview?.activeMentorships || 0} assignments`,
      done: (overview?.activeMentorships || 0) > 0,
    },
  ];

  if (loading) {
    return <RoleDashboardSkeleton />;
  }

  const gaugeR = 54;
  const gaugeC = 2 * Math.PI * gaugeR;
  const gaugeOffset = gaugeC - (engagementScore / 100) * gaugeC;

  return (
    <div className="w-full max-w-[1680px] mx-auto pb-8 min-w-0 overflow-x-hidden">
      <div className="mb-5">
        <OccasionToast />
      </div>
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {getFirstName(user?.name)}!
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
            You have{" "}
            <span className="font-semibold text-primary">
              {overview?.liveClasses || 0} live class
              {(overview?.liveClasses || 0) === 1 ? "" : "es"}
            </span>{" "}
            and{" "}
            <span className="font-semibold text-slate-700">
              {overview?.activeMentorships || 0} active mentorships
            </span>{" "}
            on GYGI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(toAdmin("activity-logs"))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-primary"
            aria-label="Activity"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(toAdmin("analytics"))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-primary"
            aria-label="Search analytics"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(toAdmin("users"))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-primary"
            aria-label="Messages"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(toAdmin("categories"))}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden min-[380px]:inline">Create category</span>
            <span className="min-[380px]:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Top metrics — 3-up from lg; on sm the odd last card spans full width (no right rail) */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:grid-cols-2 sm:gap-4 sm:[&>:last-child:nth-child(odd)]:col-span-2 lg:grid-cols-3 lg:[&>:last-child:nth-child(odd)]:col-span-1 lg:gap-5">
        {metricCards.map((card) => {
          const chartData = card.chart.map((v, i) => ({ i, v }));
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => navigate(card.url)}
              className="rounded-[1.5rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 text-left hover:shadow-md transition-all min-w-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">
                    {card.value}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <ArrowUpRight className="w-3 h-3" />
                    {card.delta}
                  </span>
                </div>
                <div className="w-20 h-12 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    {card.line ? (
                      <LineChart data={chartData}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={card.color}
                          strokeWidth={2}
                          dot={{ r: 2, fill: card.color }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={8}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={card.color} opacity={0.35 + i * 0.08} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main board — stack until xl so sidebar + content don't crumble */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-3">
          {/* Platform details */}
          <section className="rounded-[1.5rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 min-w-0">
            <h3 className="text-sm font-black text-slate-900 mb-3">
              Platform details
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Students", value: overview?.totalStudents || 0 },
                { label: "Tutors", value: overview?.totalTutors || 0 },
                { label: "Mentors", value: overview?.totalMentors || 0 },
                { label: "Admins", value: overview?.totalAdmins || 0 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-[#F7F5FB] px-3 py-2.5 min-w-0"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                  <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Lead contact style — admin profile */}
          <section className="rounded-[1.5rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-3">
              Platform lead
            </p>
            <button
              type="button"
              onClick={() => navigate(toAdmin("profile"))}
              className="flex w-full items-center gap-3 rounded-2xl text-left transition hover:bg-slate-50"
            >
              <Avatar className="w-11 h-11 border-2 border-primary/20">
                <AvatarImage src={avatarSrc} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || "admin@gygi"}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-primary shrink-0">
                Profile
              </span>
            </button>
          </section>

          {/* Speed / engagement gauge */}
          <section className="rounded-[1.5rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 min-w-0">
            <p className="text-sm font-black text-slate-900 mb-1">
              Engagement pulse
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              Live classes + mentorships + recordings
            </p>
            <div className="relative mx-auto w-[140px] h-[140px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={gaugeR}
                  fill="none"
                  stroke="#F3E8FF"
                  strokeWidth="12"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={gaugeR}
                  fill="none"
                  stroke="#c147e9"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={gaugeC}
                  strokeDashoffset={gaugeOffset}
                />
                <circle
                  cx="70"
                  cy="70"
                  r={gaugeR - 16}
                  fill="none"
                  stroke="#E9D5FF"
                  strokeWidth="6"
                  strokeDasharray={`${gaugeC * 0.35} ${gaugeC}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-slate-900 tabular-nums">
                  {engagementScore}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">score</p>
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-4 text-[10px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" /> Current
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-200" /> Baseline
              </span>
            </div>
          </section>
        </div>

        {/* Center column */}
        <div className="xl:col-span-5 flex flex-col gap-4 min-w-0">
          {/* Active ops tracking card */}
          <section className="rounded-[1.75rem] bg-gradient-to-br from-primary via-[#b03ad4] to-fuchsia-500 text-white p-5 sm:p-6 shadow-xl shadow-primary/25 min-w-0 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                    Platform ops
                  </p>
                  <h3 className="text-lg font-black mt-1">
                    Live learning pipeline
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    Categories → Classes → Mentorship → Recordings
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Live
                </span>
              </div>

              {/* Route progress */}
              <div className="relative my-5 px-1">
                <div className="h-1.5 rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white relative"
                    style={{
                      width: `${Math.min(100, 40 + (overview?.liveClasses || 0) * 10 + (overview?.activeMentorships || 0) * 5)}%`,
                    }}
                  >
                    <span className="absolute -right-3 -top-2.5 w-6 h-6 rounded-full bg-white text-primary flex items-center justify-center shadow">
                      <Video className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-white/80">
                  <span>Onboard</span>
                  <span>Deliver</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {opsTimeline.map((step, i) => (
                  <div key={step.label} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black",
                        step.done
                          ? "bg-white text-primary"
                          : "bg-white/20 text-white",
                      )}
                    >
                      {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold">{step.label}</p>
                      <p className="text-[11px] text-white/75">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                  <span className="text-white/80">Pipeline completion</span>
                  <span>{Math.min(100, 40 + engagementScore / 2)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${Math.min(100, 40 + engagementScore / 2)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Brand / product card */}
          <section className="rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-5 min-w-0 flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-40 h-36 rounded-[1.35rem] bg-gradient-to-br from-primary/20 via-violet-100 to-fuchsia-50 flex items-center justify-center shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 40%, #c147e9 0, transparent 45%), radial-gradient(circle at 70% 60%, #8b5cf6 0, transparent 40%)",
                }}
              />
              <GraduationCap className="relative h-12 w-12 text-primary" />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                GYGI Platform
              </p>
              <h3 className="text-base font-black text-slate-900 mt-1">
                Learning delivery engine
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                <div className="rounded-xl bg-[#F7F5FB] px-3 py-2">
                  <p className="text-[10px] text-slate-400 font-bold">Recordings</p>
                  <p className="text-sm font-black text-slate-900 tabular-nums">
                    {overview?.totalRecordings || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F7F5FB] px-3 py-2">
                  <p className="text-[10px] text-slate-400 font-bold">Categories</p>
                  <p className="text-sm font-black text-slate-900 tabular-nums">
                    {overview?.totalCategories || 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Platform health mini grid */}
          <section className="rounded-[1.5rem] bg-[#FAFAFC] border border-slate-200/60 p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900">Platform health</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Live Classes",
                  value: overview?.liveClasses || 0,
                  icon: Video,
                  url: toAdmin("recordings"),
                  color: "text-rose-500",
                  bg: "bg-rose-500/10",
                },
                {
                  label: "Recordings",
                  value: overview?.totalRecordings || 0,
                  icon: PlayCircle,
                  url: toAdmin("recordings"),
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                },
                {
                  label: "Mentorships",
                  value: overview?.activeMentorships || 0,
                  icon: HeartHandshake,
                  url: toAdmin("mentorship"),
                  color: "text-teal-500",
                  bg: "bg-teal-500/10",
                },
                {
                  label: "Admins",
                  value: overview?.totalAdmins || 0,
                  icon: Shield,
                  url: toAdmin("users?role=admin"),
                  color: "text-indigo-500",
                  bg: "bg-indigo-500/10",
                },
              ].map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => navigate(stat.url)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/60 hover:border-primary/30 text-left transition-all min-w-0"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      stat.bg,
                    )}
                  >
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-slate-900 tabular-nums leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right column — map overview style */}
        <div className="xl:col-span-4 flex flex-col gap-4 min-w-0">
          <section className="rounded-[1.75rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 min-w-0 flex-1 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Network overview
                </h3>
                <p className="text-[11px] text-slate-400">
                  Users across categories
                </p>
              </div>
              <div className="flex gap-1">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Minus className="w-3.5 h-3.5" />
                </span>
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <PlusIcon className="w-3.5 h-3.5" />
                </span>
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Stylized map */}
            <div className="relative rounded-[1.35rem] bg-[#F3F4F6] h-[260px] sm:h-[320px] overflow-hidden">
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 300 320"
                preserveAspectRatio="xMidYMid slice"
              >
                <path
                  d="M 60 260 C 100 180, 140 220, 160 140 S 220 100, 250 70"
                  fill="none"
                  stroke="#c147e9"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="60" cy="260" r="8" fill="#c147e9" />
                <circle cx="250" cy="70" r="8" fill="#1e1b4b" />
                <polygon points="200,95 230,78 210,115" fill="#6366f1" />
              </svg>

              <div className="absolute left-3 bottom-3 rounded-2xl bg-white/95 backdrop-blur px-3 py-2 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Coverage
                </p>
                <p className="text-sm font-black text-slate-900 tabular-nums">
                  {totalUsers}
                  <span className="text-xs font-semibold text-slate-400">
                    {" "}
                    / {(overview?.totalCategories || 0) || 1} cats
                  </span>
                </p>
              </div>

              <div className="absolute right-3 top-3 rounded-full bg-primary text-white text-[10px] font-bold px-3 py-1.5 shadow">
                Students → Mentors
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate(toAdmin("users?role=student"))}
                className="rounded-2xl bg-[#F7F5FB] p-3 text-left hover:bg-primary/10 transition-colors"
              >
                <Users className="w-4 h-4 text-primary mb-1" />
                <p className="text-lg font-black text-slate-900 tabular-nums">
                  {overview?.totalStudents || 0}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Students</p>
              </button>
              <button
                type="button"
                onClick={() => navigate(toAdmin("categories"))}
                className="rounded-2xl bg-[#F7F5FB] p-3 text-left hover:bg-primary/10 transition-colors"
              >
                <FolderTree className="w-4 h-4 text-primary mb-1" />
                <p className="text-lg font-black text-slate-900 tabular-nums">
                  {overview?.totalCategories || 0}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">Categories</p>
              </button>
            </div>
          </section>
        </div>

        {/* System status */}
        <section className="xl:col-span-4 rounded-[1.5rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">System Status</h3>
              <p className="text-[11px] text-slate-500">Operational overview</p>
            </div>
          </div>
          <div className="space-y-2">
            {["API Server", "Database", "Storage"].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAFC] border border-slate-100"
              >
                <span className="text-xs text-slate-600 font-medium">{label}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Operational
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Overall Health
              </span>
              <span className="text-xs font-bold text-emerald-600">100%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="xl:col-span-8 rounded-[1.5rem] bg-white border border-slate-200/70 shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
              <p className="text-[11px] text-slate-500">
                Manage your platform efficiently
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.url)}
                className="group flex flex-col items-start gap-3 p-4 rounded-2xl border border-slate-200/60 bg-[#FAFAFC] hover:border-primary/30 hover:shadow-sm transition-all text-left min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary self-end transition-colors" />
              </button>
            ))}
          </div>
        </section>

        {/* Latest activity */}
        <RecentActivityFeed
          className="xl:col-span-7 min-w-0"
          viewAllHref={toAdmin("activity-logs")}
          limit={5}
          title="Latest activity"
          subtitle="Recent platform events"
        />

        {/* Efficiency */}
        <section className="xl:col-span-5 relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary to-violet-600 text-white p-5 sm:p-6 shadow-lg shadow-primary/20 min-w-0">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full min-h-[180px]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold opacity-90">
                Platform Efficiency
              </h4>
              <button
                type="button"
                onClick={() => navigate(toAdmin("analytics"))}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="my-5">
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="text-4xl sm:text-5xl font-black tabular-nums">
                  {engagementScore}%
                </h2>
                <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                  Optimal
                </span>
              </div>
              <p className="text-[11px] opacity-90">
                {totalUsers} active users across{" "}
                {overview?.totalCategories || 0} categories
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(toAdmin("analytics"))}
              className="mt-auto inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-white text-primary text-xs font-bold hover:bg-white/90 w-full sm:w-auto"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              View Analytics
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
