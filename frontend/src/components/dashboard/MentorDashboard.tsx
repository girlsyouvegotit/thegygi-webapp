import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleDashboardSkeleton } from "@/components/loading/PageSkeleton";
import OccasionToast from "@/components/occasions/OccasionToast";
import { useNavigate } from "react-router";
import { useNotification } from "@/hooks/useNotification";
import {
  format,
  isSameDay,
  startOfWeek,
  addDays,
  isToday,
} from "date-fns";
import type {
  mentorAnalytics,
  mentorshipSession,
  mentorshipGoal,
  user,
  mentorAssignment,
} from "@/types";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  Target,
  CheckCircle2,
  MessageSquare,
  StickyNote,
  Search,
  Plus,
  Download,
  Clock,
  FileText,
  ArrowUpRight,
  CircleUser,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { withMediaCacheBust } from "@/lib/profileMedia";

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

const soft =
  "rounded-[1.5rem] border border-slate-100/90 bg-white p-4 shadow-[0_10px_40px_rgba(28,28,33,0.05)] sm:p-5 lg:p-6";

const MentorDashboard = () => {
  const { user } = useAuth();
  const { unreadCount, notifications, markAsRead, fetchNotifications } =
    useNotification();
  const navigate = useNavigate();
  const boardNotifications = useMemo(() => {
    const paid = notifications.filter((n) => n.type === "salary_paid");
    const rest = notifications.filter((n) => n.type !== "salary_paid");
    return [...paid, ...rest].slice(0, 6);
  }, [notifications]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const [analytics, setAnalytics] = useState<mentorAnalytics | null>(null);
  const [sessions, setSessions] = useState<mentorshipSession[]>([]);
  const [goals, setGoals] = useState<mentorshipGoal[]>([]);
  const [mentees, setMentees] = useState<user[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [weekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const fetchData = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
      try {
      const [analyticsRes, sessionsRes, goalsRes, menteesRes] =
        await Promise.all([
          api.get(`/analytics/mentor/${user._id}`),
          api.get("/mentorship/sessions/my"),
          api.get("/mentorship/goals").catch(() => null),
          api.get("/mentorship/my-mentees").catch(() => null),
        ]);

      setAnalytics(analyticsRes.data.data.analytics as mentorAnalytics);
      setSessions(
        (sessionsRes.data.data.sessions as mentorshipSession[]) || [],
      );
      setGoals((goalsRes?.data?.data?.goals as mentorshipGoal[]) || []);
      const assignments =
        (menteesRes?.data?.data?.assignments as mentorAssignment[]) || [];
      const uniqueMentees = new Map<string, user>();
      for (const assignment of assignments) {
        for (const mentee of assignment.mentees || []) {
          if (mentee?._id) uniqueMentees.set(mentee._id, mentee);
        }
      }
      setMentees(Array.from(uniqueMentees.values()));
    } catch (error: unknown) {
        console.error("Failed to load mentor dashboard:", error);
      toast.error(getErrorMessage(error, "Failed to load dashboard"));
      } finally {
        setLoading(false);
      }
  }, [user?._id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const firstName = user?.name?.split(" ")[0] || "Mentor";
  const avatarSrc = withMediaCacheBust(user?.avatar, user?.avatarUpdatedAt);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const upcomingSessions = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter(
        (s) =>
          (s.status === "scheduled" ||
            s.status === "confirmed" ||
            s.status === "live") &&
          new Date(s.scheduledDate).getTime() >= now - 60 * 60 * 1000,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime(),
      );
  }, [sessions]);

  const todaySessions = useMemo(
    () =>
      sessions
        .filter((s) => isToday(new Date(s.scheduledDate)))
        .sort(
          (a, b) =>
            new Date(a.scheduledDate).getTime() -
            new Date(b.scheduledDate).getTime(),
        ),
    [sessions],
  );

  const goalCompletionPct = useMemo(() => {
    const total = analytics?.totalGoals || 0;
    if (!total) return 0;
    return Math.round(((analytics?.completedGoals || 0) / total) * 100);
  }, [analytics]);

  const sessionDonePct = useMemo(() => {
    const total = analytics?.totalSessions || 0;
    if (!total) return 0;
    return Math.round(((analytics?.completedSessions || 0) / total) * 100);
  }, [analytics]);

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === "active"),
    [goals],
  );

  const featuredGoal = activeGoals[0];

  const goalProgress = (g: mentorshipGoal) => {
    const milestones = g.milestones || [];
    if (!milestones.length) return g.status === "completed" ? 100 : 35;
    const done = milestones.filter((m) => m.completed).length;
    return Math.round((done / milestones.length) * 100);
  };

  const filteredMentees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mentees;
    return mentees.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q),
    );
  }, [mentees, search]);

  const weekEvents = useMemo(() => {
    return weekDays.flatMap((day) => {
      const daySessions = sessions
        .filter((s) => isSameDay(new Date(s.scheduledDate), day))
        .slice(0, 2);
      return daySessions.map((s) => ({ day, session: s }));
    });
  }, [weekDays, sessions]);

  const nextSession = upcomingSessions[0];
  const menteeCount = analytics?.totalMentees ?? mentees.length;

  const priorityFor = (s: mentorshipSession) => {
    const t = new Date(s.scheduledDate).getTime() - Date.now();
    if (t < 1000 * 60 * 60 * 8) return "High";
    if (t < 1000 * 60 * 60 * 48) return "Medium";
    return "Low";
  };

  if (loading) {
    return <RoleDashboardSkeleton />;
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1280px] space-y-5 p-3 sm:p-5 lg:max-w-[1400px] lg:space-y-7 lg:p-8 xl:space-y-8 xl:px-10">
        <OccasionToast />
        {/* Top toolbar — no duplicate nav */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="relative min-w-0 flex-1 lg:max-w-lg">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mentees..."
              className="h-11 rounded-full border-transparent bg-white pl-11 text-sm shadow-[0_8px_24px_rgba(28,28,33,0.04)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-4"
              onClick={() => navigate("/mentor/profile")}
            >
              <CircleUser className="h-4 w-4 shrink-0 text-primary" />
              <span className="hidden sm:inline">Your profile</span>
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-primary"
              aria-label="Private notes"
              onClick={() => navigate("/mentor/notes")}
            >
              <StickyNote className="h-4 w-4" />
            </button>
            <Button
              variant="outline"
              className="h-11 rounded-full border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm"
              onClick={() => navigate("/mentor/sessions")}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              className="h-11 rounded-full bg-[#1C1C21] px-4 text-sm font-bold text-white hover:bg-[#1C1C21]/90"
              onClick={() => navigate("/mentor/sessions")}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New session
            </Button>
          </div>
        </div>

        {/* Greeting */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:gap-8 lg:pt-1">
          <div className="flex max-w-xl items-start gap-3 lg:max-w-2xl">
            <button
              type="button"
              onClick={() => navigate("/mentor/profile")}
              className="mt-1 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open your profile"
            >
              <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-1 ring-slate-100 sm:h-14 sm:w-14">
                <AvatarImage src={avatarSrc} alt={user?.name} />
                <AvatarFallback className="bg-primary/10 text-sm font-black text-primary">
                  {firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Hi, {firstName}! What are your plans for today?
              </h1>
              <p className="mt-2 text-sm text-slate-500 lg:mt-3 lg:leading-relaxed">
                Stay on top of sessions, goals, and mentee progress — all in one
                place.
              </p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {(filteredMentees.length ? filteredMentees : mentees)
              .slice(0, 5)
              .map((m) => (
                <Avatar
                  key={m._id}
                  className="h-10 w-10 border-2 border-white shadow-sm"
                >
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {m.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
            <button
              type="button"
              onClick={() => navigate("/mentor/mentees")}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400"
              aria-label="View mentees"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
      </div>

        {/* Feature cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {[
            {
              title: "Stay organized",
              desc: "Plan sessions with clarity",
              icon: Calendar,
              url: "/mentor/sessions",
              tone: "bg-violet-50 text-violet-700",
            },
            {
              title: "Sync your notes",
              desc: "Capture mentee takeaways",
              icon: StickyNote,
              url: "/mentor/notes",
              tone: "bg-fuchsia-50 text-fuchsia-700",
            },
            {
              title: "Collaborate",
              desc: "Share feedback that lands",
              icon: MessageSquare,
              url: "/mentor/feedback",
              tone: "bg-emerald-50 text-emerald-700",
            },
          ].map((card) => (
            <button
              key={card.url}
              type="button"
              onClick={() => navigate(card.url)}
              className={cn(
                soft,
                "group text-left transition hover:-translate-y-0.5 hover:shadow-md",
              )}
            >
              <span
                className={cn(
                  "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl",
                  card.tone,
                )}
              >
                <card.icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-bold text-slate-900">{card.title}</p>
              <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigate("/mentor/goals")}
            className="flex min-h-[140px] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-white/60 text-slate-400 transition hover:border-primary/40 hover:text-primary"
          >
            <Plus className="mb-2 h-6 w-6" />
            <span className="text-sm font-bold">Add new goal</span>
          </button>
        </div>

        {/* Mid grid */}
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          {/* Notifications — real inbox (incl. salary paid) */}
          <section className={cn(soft, "lg:col-span-4")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {unreadCount}
              </span>
            </div>
            <div className="space-y-2.5">
              {boardNotifications.map((n, i) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => {
                    if (!n.isRead) void markAsRead(n._id);
                    if (n.link) navigate(n.link);
                  }}
                  className={cn(
                    "w-full rounded-2xl px-3 py-3 text-left transition",
                    i === 0 || !n.isRead
                      ? "bg-white shadow-[0_8px_24px_rgba(28,28,33,0.08)] ring-1 ring-slate-100"
                      : "bg-slate-50 hover:bg-slate-100/80",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.type === "salary_paid"
                          ? "bg-emerald-500"
                          : !n.isRead
                            ? "bg-primary"
                            : "bg-slate-300",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              {boardNotifications.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  No notifications yet
                </p>
              ) : null}
            </div>
          </section>

          {/* Active assignment / goal */}
          <section className={cn(soft, "lg:col-span-4")}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Active goal</h2>
              <FileText className="h-4 w-4 text-slate-300" />
            </div>
            {featuredGoal ? (
              <>
                <p className="text-base font-bold leading-snug text-slate-900">
                  {featuredGoal.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {featuredGoal.description ||
                    `Working with ${featuredGoal.mentee?.name || "mentee"}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    Mentorship
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    Active
                  </span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-600">
                    High
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={featuredGoal.mentee?.avatar} />
                    <AvatarFallback className="text-[10px] font-bold">
                      {featuredGoal.mentee?.name?.charAt(0) || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-600">
                    {featuredGoal.mentee?.name}
                  </span>
                  <span className="ml-auto text-[11px] font-bold text-primary">
                    {goalProgress(featuredGoal)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${goalProgress(featuredGoal)}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <Target className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-sm text-slate-500">No active goals yet</p>
              </div>
            )}
            <Button
              variant="outline"
              className="mt-4 h-10 w-full rounded-full border-dashed border-slate-300 text-sm font-semibold"
              onClick={() => navigate("/mentor/goals")}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add new goal
            </Button>
          </section>

          {/* Week calendar strip */}
          <section className={cn(soft, "lg:col-span-4")}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">This week</h2>
              <span className="text-[11px] font-semibold text-slate-400">
                {format(weekStart, "d MMM")} –{" "}
                {format(addDays(weekStart, 6), "d MMM")}
              </span>
            </div>
            <div className="mb-4 flex justify-between gap-1">
              {weekDays.map((d) => (
                <div
                  key={d.toISOString()}
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-2xl py-2",
                    isToday(d) && "bg-primary text-white shadow-md shadow-primary/25",
                  )}
                >
                  <span
                    className={cn(
                      "text-[9px] font-bold",
                      isToday(d) ? "text-white/70" : "text-slate-400",
                    )}
                  >
                    {format(d, "EEE")}
                  </span>
                  <span className="text-sm font-black">{format(d, "d")}</span>
                </div>
              ))}
            </div>
            <div className="relative space-y-3 border-l border-dashed border-slate-200 pl-4">
              {(weekEvents.length ? weekEvents : [])
                .slice(0, 3)
                .map(({ day, session: s }) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => navigate("/mentor/sessions")}
                    className="relative block w-full text-left"
                  >
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white" />
                    <p className="text-[10px] font-bold text-slate-400">
                      {format(new Date(s.scheduledDate), "EEE · h:mm a")}
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {s.topic || s.mentee?.name || "Session"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isSameDay(day, new Date()) ? "Today" : format(day, "MMM d")}
                    </p>
                  </button>
                ))}
              {weekEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No sessions this week</p>
              ) : null}
            </div>
          </section>
        </div>

        {/* Bottom grid */}
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          {/* Today tasks */}
          <section className={cn(soft, "lg:col-span-4")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s focus</h2>
              <button
                type="button"
                onClick={() => navigate("/mentor/goals")}
                className="text-[11px] font-bold text-primary"
              >
                See all
              </button>
            </div>
            <ul className="space-y-3">
              {(activeGoals.length
                ? activeGoals
                : goals.slice(0, 3)
              )
                .slice(0, 4)
                .map((g) => {
                  const pct = goalProgress(g);
                  return (
                    <li key={g._id}>
                      <button
                        type="button"
                        onClick={() => navigate("/mentor/goals")}
                        className="w-full text-left"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {g.title}
                          </p>
                          <span className="shrink-0 text-[11px] font-bold text-slate-400">
                            {pct}%
                          </span>
                        </div>
                        <div className="mb-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {g.targetDate
                            ? format(new Date(g.targetDate), "MMM d")
                            : "No due date"}
                          <span>·</span>
                          {g.mentee?.name}
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              {!goals.length ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Goals you set will appear here
                </p>
              ) : null}
            </ul>
          </section>

          {/* Progress donuts — roomy card */}
          <section
            className={cn(
              soft,
              "flex flex-col justify-center gap-5 lg:col-span-5 lg:gap-6",
            )}
          >
            <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              Progress
            </p>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  label: "Goals",
                  pct: goalCompletionPct,
                  sub: `${analytics?.completedGoals ?? 0} done`,
                },
                {
                  label: "Sessions",
                  pct: sessionDonePct,
                  sub: `${analytics?.completedSessions ?? 0} done`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center rounded-2xl bg-slate-50/90 px-4 py-5 sm:px-5 sm:py-6"
                >
                  <div
                    className="relative h-24 w-24 rounded-full sm:h-28 sm:w-28"
                    style={{
                      background: `conic-gradient(var(--primary) 0 ${item.pct}%, #EDE4F5 ${item.pct}% 100%)`,
                    }}
                  >
                    <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white text-base font-black text-slate-900 sm:inset-3.5 sm:text-lg">
                      {item.pct}%
                    </div>
                  </div>
                  <p className="mt-3.5 text-sm font-bold text-slate-800 sm:text-base">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Meeting invite */}
          <section className={cn(soft, "lg:col-span-3")}>
            <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              Next session
            </p>
            {nextSession ? (
              <>
                <p className="mt-2 text-sm font-bold leading-snug text-slate-900">
                  {nextSession.topic || "Mentorship session"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {nextSession.mentee?.name}
                  <br />
                  {format(new Date(nextSession.scheduledDate), "EEE, MMM d · h:mm a")}
                </p>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                    priorityFor(nextSession) === "High" &&
                      "bg-rose-50 text-rose-600",
                    priorityFor(nextSession) === "Medium" &&
                      "bg-amber-50 text-amber-700",
                    priorityFor(nextSession) === "Low" &&
                      "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {priorityFor(nextSession)}
                </span>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full text-xs"
                    onClick={() => navigate("/mentor/sessions")}
                  >
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 rounded-full bg-primary text-xs text-white hover:bg-primary/90"
                    onClick={() => navigate("/mentor/sessions")}
                  >
                    Open session
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-4 text-center">
                <Calendar className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                <p className="text-xs text-slate-500">Nothing scheduled</p>
                <Button
                  size="sm"
                  className="mt-3 h-8 rounded-full bg-primary text-xs text-white"
                  onClick={() => navigate("/mentor/sessions")}
                >
                  Schedule
                </Button>
              </div>
            )}
          </section>

          {/* Promo */}
          <section className="relative overflow-hidden rounded-[1.5rem] bg-primary p-5 text-white shadow-[0_12px_40px_rgba(193,71,233,0.35)] lg:col-span-12 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:p-6">
            <div className="relative z-10 max-w-xl">
              <p className="text-xs font-semibold text-white/70">Keep growing</p>
              <p className="mt-2 text-xl font-black leading-snug">
                Guide with clarity
              </p>
              <p className="mt-2 text-sm text-white/75">
                {menteeCount} mentees · {analytics?.activeGoals ?? 0} active goals
              </p>
            </div>

            <Button
              className="relative z-10 mt-5 h-10 rounded-full bg-white font-bold text-primary hover:bg-white/90 lg:mt-0"
              onClick={() => navigate("/mentor/mentees")}
            >
              View mentees
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </section>
        </div>

        {/* Today sessions list if any */}
        {todaySessions.length > 0 ? (
          <section className={soft}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Today&apos;s sessions
              </h2>
              <Users className="h-4 w-4 text-slate-300" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todaySessions.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => navigate("/mentor/sessions")}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-left transition hover:bg-primary/5"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={s.mentee?.avatar} />
                    <AvatarFallback className="text-xs font-bold">
                      {s.mentee?.name?.charAt(0) || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {s.mentee?.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {format(new Date(s.scheduledDate), "h:mm a")} ·{" "}
                      {s.duration || 60}m
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary/40" />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default MentorDashboard;
