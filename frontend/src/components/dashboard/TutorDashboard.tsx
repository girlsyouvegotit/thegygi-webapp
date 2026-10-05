import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import {
  Video,
  FileText,
  FileQuestion,
  TrendingUp,
  Users,
  Activity,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Clock,
  Radio,
  Bell,
  GraduationCap,
  Calendar,
  Clapperboard,
  AlertTriangle,
  PenLine,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleDashboardSkeleton } from "@/components/loading/PageSkeleton";
import OccasionToast from "@/components/occasions/OccasionToast";
import { useNavigate } from "react-router";
import type { liveClass, tutorAnalytics, quiz, assignment } from "@/types";
import { cn } from "@/lib/utils";
import { withMediaCacheBust } from "@/lib/profileMedia";
import { useNotification } from "@/hooks/useNotification";
import { getNotificationVisual } from "@/components/notifications/notificationVisuals";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  formatDistanceToNow,
  isBefore,
  startOfDay,
} from "date-fns";


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

function MiniSpark({
  points,
  stroke = "#c147e9",
  className,
}: {
  points: number[];
  stroke?: string;
  className?: string;
}) {
  const width = 120;
  const height = 32;
  const safe = points.length ? points : [0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const span = max - min || 1;
  const polylinePoints = safe
    .map((value, index) => {
      const x =
        safe.length === 1 ? width / 2 : (index / (safe.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-full opacity-80", className)}
      aria-hidden
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />
    </svg>
  );
}

function Donut({
  segments,
  centerLabel,
  centerSub,
}: {
  segments: { value: number; color: string; label: string }[];
  centerLabel: string;
  centerSub?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cursor = 0;
  const gradient =
    total === 0
      ? "#e2e8f0 0deg 360deg"
      : segments
          .map((seg) => {
            const start = (cursor / total) * 360;
            cursor += seg.value;
            const end = (cursor / total) * 360;
            return `${seg.color} ${start}deg ${end}deg`;
          })
          .join(", ");

  return (
    <div className="flex min-w-0 flex-col items-center gap-4 overflow-hidden">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full sm:h-36 sm:w-36"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-white sm:inset-3">
          <span className="text-2xl font-black text-slate-900 tabular-nums">
            {centerLabel}
          </span>
          {centerSub ? (
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {centerSub}
            </span>
          ) : null}
        </div>
      </div>
      <ul className="grid w-full max-w-xs grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-medium text-slate-600">
        {segments.map((seg) => (
          <li key={seg.label} className="flex min-w-0 items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="min-w-0 truncate">
              {seg.label}{" "}
              <span className="font-bold text-slate-900">{seg.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const getFirstName = (fullName?: string): string => {
  if (!fullName) return "Tutor";
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

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const sparkFromClasses = (classes: liveClass[], bucketCount = 7): number[] => {
  const counts = new Array(bucketCount).fill(0);
  const today = startOfDay(new Date());
  for (const cls of classes) {
    const d = startOfDay(new Date(cls.scheduledDate));
    const diffDays = Math.round(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const idx = bucketCount - 1 + diffDays;
    if (idx >= 0 && idx < bucketCount) counts[idx] += 1;
  }
  return counts;
};

const isSessionNow = (cls: liveClass): boolean => {
  if (cls.status === "live") return true;
  if (cls.status !== "scheduled") return false;
  const now = Date.now();
  const start = new Date(cls.scheduledDate).getTime();
  const end = start + cls.duration * 60 * 1000;
  return now >= start && now <= end;
};

const timelineAccent = (cls: liveClass): string => {
  if (cls.status === "live") return "#fb7185";
  if (cls.status === "scheduled") return "#38bdf8";
  if (cls.status === "recorded") return "#a78bfa";
  if (cls.status === "ended") return "#34d399";
  return "#94a3b8";
};

type RiskLevel = "High" | "Medium" | "Low";

const riskStyles: Record<
  RiskLevel,
  { badge: string; border: string }
> = {
  High: {
    badge: "bg-rose-100 text-rose-700",
    border: "border-l-rose-500",
  },
  Medium: {
    badge: "bg-amber-100 text-amber-800",
    border: "border-l-amber-500",
  },
  Low: {
    badge: "bg-sky-100 text-sky-800",
    border: "border-l-sky-400",
  },
};

const TutorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const avatarSrc = withMediaCacheBust(user?.avatar, user?.avatarUpdatedAt);
  const { notifications, unreadCount, markAsRead, fetchNotifications } =
    useNotification();
  const boardNotifications = useMemo(() => {
    const paid = notifications.filter((n) => n.type === "salary_paid");
    const rest = notifications.filter((n) => n.type !== "salary_paid");
    return [...paid, ...rest].slice(0, 6);
  }, [notifications]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);
  const [myClasses, setMyClasses] = useState<liveClass[]>([]);
  const [analytics, setAnalytics] = useState<tutorAnalytics | null>(null);
  const [quizzes, setQuizzes] = useState<quiz[]>([]);
  const [assignments, setAssignments] = useState<assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const [classesRes, analyticsRes, quizzesRes, assignmentsRes] =
        await Promise.all([
          api.get("/classes"),
          api.get(`/analytics/tutor/${user._id}`),
          api.get("/quizzes").catch(() => null),
          api.get("/assignments").catch(() => null),
        ]);

      setMyClasses((classesRes.data.data.classes as liveClass[]) || []);
      setAnalytics(analyticsRes.data.data.analytics as tutorAnalytics);
      setQuizzes(
        quizzesRes?.data?.data?.quizzes
          ? (quizzesRes.data.data.quizzes as quiz[])
          : [],
      );
      setAssignments(
        assignmentsRes?.data?.data?.assignments
          ? (assignmentsRes.data.data.assignments as assignment[])
          : [],
      );
    } catch (error: unknown) {
      console.error("Failed to load tutor dashboard:", error);
      console.error(getErrorMessage(error, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const liveClasses = useMemo(
    () => myClasses.filter((c) => c.status === "live"),
    [myClasses],
  );

  const upcomingClasses = useMemo(() => {
    const now = Date.now();
    return myClasses
      .filter(
        (c) =>
          c.status === "scheduled" &&
          new Date(c.scheduledDate).getTime() > now,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime(),
      );
  }, [myClasses]);

  const completedClasses = useMemo(
    () =>
      myClasses.filter(
        (c) => c.status === "ended" || c.status === "recorded",
      ),
    [myClasses],
  );

  const recordingClasses = useMemo(
    () =>
      myClasses.filter(
        (c) => c.status === "recorded" || c.status === "processing",
      ),
    [myClasses],
  );

  const todayClasses = useMemo(() => {
    const today = startOfDay(new Date());
    return myClasses
      .filter((c) => isSameDay(new Date(c.scheduledDate), today))
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime(),
      );
  }, [myClasses]);

  const activeQuizzes = useMemo(
    () => quizzes.filter((q) => q.isActive),
    [quizzes],
  );

  const assignmentsNeedingAttention = useMemo(() => {
    const now = startOfDay(new Date());
    return assignments.filter((a) => {
      if (!a.isActive) return false;
      const due = startOfDay(new Date(a.dueDate));
      return isBefore(due, now) || due.getTime() - now.getTime() <= 86400000 * 3;
    });
  }, [assignments]);

  const pendingTasksCount = useMemo(() => {
    const now = Date.now();
    const dueSoon = assignments.filter((a) => {
      const due = new Date(a.dueDate).getTime();
      return a.isActive && due > now && due - now < 48 * 60 * 60 * 1000;
    });
    const overdue = assignments.filter(
      (a) => a.isActive && new Date(a.dueDate).getTime() < now,
    );
    const closingQuizzes = quizzes.filter((q) => {
      const end = new Date(q.endDate).getTime();
      return q.isActive && end > now && end - now < 72 * 60 * 60 * 1000;
    });
    return dueSoon.length + overdue.length + closingQuizzes.length;
  }, [assignments, quizzes]);

  const weeklyActivity = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = new Array(7).fill(0);
    const todayIdx = (new Date().getDay() + 6) % 7;
    for (const c of myClasses) {
      const idx = (new Date(c.scheduledDate).getDay() + 6) % 7;
      counts[idx] += 1;
    }
    const max = Math.max(...counts, 1);
    return days.map((day, i) => ({
      day,
      count: counts[i],
      heightPct: counts[i] === 0 ? 6 : Math.round((counts[i] / max) * 100),
      active: i === todayIdx,
    }));
  }, [myClasses]);

  const categoryPerformance = useMemo(() => {
    const map = new Map<
      string,
      { sessions: number; quizCount: number }
    >();
    for (const c of myClasses) {
      const name = c.category?.name || "Uncategorized";
      const entry = map.get(name) || { sessions: 0, quizCount: 0 };
      entry.sessions += 1;
      map.set(name, entry);
    }
    for (const q of quizzes) {
      const name = q.category?.name || "Uncategorized";
      const entry = map.get(name) || { sessions: 0, quizCount: 0 };
      entry.quizCount += 1;
      map.set(name, entry);
    }
    const avgQuiz = analytics?.averageQuizScore ?? 0;
    const entries = [...map.entries()]
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 5);
    const maxSessions = Math.max(...entries.map((e) => e[1].sessions), 1);
    return entries.map(([name, data]) => ({
      name,
      sessions: data.sessions,
      sessionPct: Math.round((data.sessions / maxSessions) * 100),
      quizAvg:
        data.quizCount > 0
          ? Math.min(100, Math.round(avgQuiz + data.quizCount * 2))
          : Math.round(avgQuiz * 0.85),
    }));
  }, [myClasses, quizzes, analytics?.averageQuizScore]);

  const healthSegments = useMemo(() => {
    const upcoming = myClasses.filter((c) => c.status === "scheduled").length;
    const live = liveClasses.length;
    const completed = myClasses.filter((c) => c.status === "ended").length;
    const recordings = recordingClasses.length;
    return [
      { value: live, color: "#fb7185", label: "Live" },
      { value: upcoming, color: "#38bdf8", label: "Upcoming" },
      { value: completed, color: "#34d399", label: "Completed" },
      { value: recordings, color: "#a78bfa", label: "Recordings" },
    ].filter((s) => s.value > 0);
  }, [myClasses, liveClasses.length, recordingClasses.length]);

  const attentionAlerts = useMemo(() => {
    type Alert = {
      id: string;
      title: string;
      detail: string;
      level: RiskLevel;
      url: string;
    };
    const alerts: Alert[] = [];
    const now = Date.now();

    for (const c of liveClasses) {
      alerts.push({
        id: `live-${c._id}`,
        title: c.title,
        detail: "Session is live — students may be waiting",
        level: "High",
        url: `/tutor/classes/${c._id}/live`,
      });
    }

    for (const a of assignments) {
      const due = new Date(a.dueDate).getTime();
      if (!a.isActive) continue;
      if (due < now) {
        alerts.push({
          id: `over-${a._id}`,
          title: a.title,
          detail: `Overdue since ${format(new Date(a.dueDate), "MMM d")}`,
          level: "High",
          url: `/tutor/assignments/${a._id}/grade`,
        });
      } else if (due - now < 48 * 60 * 60 * 1000) {
        alerts.push({
          id: `due-${a._id}`,
          title: a.title,
          detail: "Due within 48 hours — review submissions",
          level: "Medium",
          url: `/tutor/assignments/${a._id}/grade`,
        });
      }
    }

    for (const q of activeQuizzes) {
      const end = new Date(q.endDate).getTime();
      if (end > now && end - now < 72 * 60 * 60 * 1000) {
        alerts.push({
          id: `quiz-${q._id}`,
          title: q.title,
          detail: "Quiz window closing soon",
          level: "Low",
          url: "/tutor/quizzes",
        });
      }
    }

    return alerts.slice(0, 6);
  }, [liveClasses, assignments, activeQuizzes]);

  const smartReminders = useMemo(() => {
    type Reminder = {
      id: string;
      icon: typeof Bell;
      title: string;
      detail: string;
      url: string;
    };
    const reminders: Reminder[] = [];
    const now = Date.now();

    if (liveClasses.length > 0) {
      reminders.push({
        id: "live",
        icon: Radio,
        title: "Live session",
        detail: `${liveClasses.length} class${liveClasses.length > 1 ? "es" : ""} in progress`,
        url: `/tutor/classes/${liveClasses[0]._id}/live`,
      });
    }

    const dueSoon = assignments.filter((a) => {
      const due = new Date(a.dueDate).getTime();
      return a.isActive && due > now && due - now < 48 * 60 * 60 * 1000;
    });
    if (dueSoon.length > 0) {
      reminders.push({
        id: "grade",
        icon: PenLine,
        title: "Grading queue",
        detail: `${dueSoon.length} assignment${dueSoon.length > 1 ? "s" : ""} due within 48h`,
        url: `/tutor/assignments/${dueSoon[0]._id}/grade`,
      });
    }

    const endingQuizzes = activeQuizzes.filter((q) => {
      const end = new Date(q.endDate).getTime();
      return end > now && end - now < 72 * 60 * 60 * 1000;
    });
    if (endingQuizzes.length > 0) {
      reminders.push({
        id: "quiz",
        icon: FileQuestion,
        title: "Quiz closing",
        detail: `${endingQuizzes.length} assessment${endingQuizzes.length > 1 ? "s" : ""} ending soon`,
        url: "/tutor/quizzes",
      });
    }

    const salaryNotices = notifications.filter(
      (n) => n.type === "salary_paid" && !n.isRead,
    );
    for (const n of salaryNotices.slice(0, 2)) {
      reminders.unshift({
        id: `pay-${n._id}`,
        icon: Banknote,
        title: n.title,
        detail: n.message,
        url: n.link || "/tutor/dashboard",
      });
    }

    if (reminders.length < 3 && upcomingClasses.length === 0 && liveClasses.length === 0) {
      reminders.push({
        id: "schedule",
        icon: Calendar,
        title: "Open calendar",
        detail: "No upcoming sessions — plan your next class",
        url: "/tutor/schedule",
      });
    }

    return reminders.slice(0, 4);
  }, [
    liveClasses,
    assignments,
    activeQuizzes,
    upcomingClasses.length,
    notifications,
  ]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const classDaysSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of myClasses) {
      set.add(format(new Date(c.scheduledDate), "yyyy-MM-dd"));
    }
    return set;
  }, [myClasses]);

  const upcomingActivities = useMemo(() => {
    const now = Date.now();
    const items: {
      id: string;
      title: string;
      sub: string;
      date: Date;
      badge: string;
      url: string;
    }[] = [];

    for (const c of upcomingClasses.slice(0, 4)) {
      items.push({
        id: c._id,
        title: c.title,
        sub: format(new Date(c.scheduledDate), "EEE · h:mm a"),
        date: new Date(c.scheduledDate),
        badge: "Class",
        url: `/tutor/classes/${c._id}/analytics`,
      });
    }

    for (const q of activeQuizzes.slice(0, 2)) {
      items.push({
        id: q._id,
        title: q.title,
        sub: `Ends ${format(new Date(q.endDate), "MMM d")}`,
        date: new Date(q.endDate),
        badge: "Quiz",
        url: "/tutor/quizzes",
      });
    }

    for (const a of assignments
      .filter((x) => new Date(x.dueDate).getTime() >= now)
      .slice(0, 2)) {
      items.push({
        id: a._id,
        title: a.title,
        sub: `Due ${format(new Date(a.dueDate), "MMM d")}`,
        date: new Date(a.dueDate),
        badge: "Assignment",
        url: `/tutor/assignments/${a._id}/grade`,
      });
    }

    return items
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6);
  }, [upcomingClasses, activeQuizzes, assignments]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Today's Classes",
        value: todayClasses.length,
        subtitle: "On your calendar today",
        icon: Video,
        iconBg: "bg-sky-100 text-sky-600",
        url: "/tutor/classes",
        stroke: "#38bdf8",
        points: sparkFromClasses(todayClasses.length ? todayClasses : myClasses),
      },
      {
        label: "Students",
        value: analytics?.totalStudents ?? 0,
        subtitle: "Across your sessions",
        icon: Users,
        iconBg: "bg-emerald-100 text-emerald-600",
        url: "/tutor/students",
        stroke: "#34d399",
        points: sparkFromClasses(myClasses),
      },
      {
        label: "Active Quizzes",
        value: activeQuizzes.length,
        subtitle: "Open for learners",
        icon: FileQuestion,
        iconBg: "bg-violet-100 text-violet-600",
        url: "/tutor/quizzes",
        stroke: "#a78bfa",
        points: [
          activeQuizzes.length,
          ...sparkFromClasses(myClasses).map((n) => n + (quizzes.length % 3)),
        ].slice(0, 7),
      },
      {
        label: "Assignments",
        value: assignmentsNeedingAttention.length,
        subtitle: "Needing attention",
        icon: FileText,
        iconBg: "bg-amber-100 text-amber-600",
        url: "/tutor/assignments",
        stroke: "#fbbf24",
        points: [
          assignmentsNeedingAttention.length,
          assignments.length,
          ...sparkFromClasses(myClasses),
        ].slice(0, 7),
      },
    ],
    [
      todayClasses,
      myClasses,
      analytics?.totalStudents,
      activeQuizzes.length,
      assignmentsNeedingAttention.length,
      assignments.length,
      quizzes.length,
    ],
  );

  const circularLinks = [
    {
      label: "Classes",
      icon: Video,
      url: "/tutor/classes",
      bg: "bg-sky-100 text-sky-600",
    },
    {
      label: "Schedule",
      icon: Calendar,
      url: "/tutor/schedule",
      bg: "bg-amber-100 text-amber-600",
    },
    {
      label: "Quizzes",
      icon: FileQuestion,
      url: "/tutor/quizzes",
      bg: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Assignments",
      icon: FileText,
      url: "/tutor/assignments",
      bg: "bg-rose-100 text-rose-600",
    },
    {
      label: "Students",
      icon: Users,
      url: "/tutor/students",
      bg: "bg-violet-100 text-violet-600",
    },
    {
      label: "Recordings",
      icon: Clapperboard,
      url: "/tutor/recordings",
      bg: "bg-slate-100 text-slate-600",
    },
    {
      label: "Analytics",
      icon: TrendingUp,
      url: "/tutor/analytics",
      bg: "bg-primary/10 text-primary",
    },
  ];

  if (loading) {
    return <RoleDashboardSkeleton />;
  }

  const attendanceCenter = `${analytics?.averageAttendance ?? 0}%`;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-1 pb-10 pt-1 sm:px-0">
      <div className="mb-5">
        <OccasionToast />
      </div>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
        <div className="min-w-0 flex-1 space-y-6">
          {/* Hero + tool cards */}
          <section className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-white p-6 shadow-sm sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
                  GYGI Tutor Portal
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {getGreeting()}, {getFirstName(user?.name)}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Empower minds. Inspire futures.
                </p>
                <p className="mt-3 max-w-lg text-sm text-slate-500">
                  You have{" "}
                  <span className="font-bold text-slate-800">
                    {todayClasses.length} class
                    {todayClasses.length === 1 ? "" : "es"}
                  </span>{" "}
                  today and{" "}
                  <span className="font-bold text-slate-800">
                    {pendingTasksCount} pending task
                    {pendingTasksCount === 1 ? "" : "s"}
                  </span>
                  .
                </p>
                <Button
                  size="sm"
                  className="mt-5 h-10 gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-md hover:bg-primary/90"
                  onClick={() => navigate("/tutor/classes")}
                >
                  View My Classes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[300px]">
              <button
                type="button"
                onClick={() => navigate("/tutor/quizzes/new")}
                className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900">
                    Quiz Builder
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Create assessments in minutes
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Open builder
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate("/tutor/assignments")}
                className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900">
                    Assignment Studio
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Publish and grade student work
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Go to studio
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {kpiCards.map((kpi) => (
              <button
                key={kpi.label}
                type="button"
                onClick={() => navigate(kpi.url)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-slate-200 hover:shadow-md sm:p-5"
              >
                <div
                  className={cn(
                    "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl",
                    kpi.iconBg,
                  )}
                >
                  <kpi.icon className="h-4 w-4" />
                </div>
                <p className="pr-12 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {kpi.label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {kpi.subtitle}
                </p>
                <div className="mt-4 -mx-1">
                  <MiniSpark points={kpi.points} stroke={kpi.stroke} />
                </div>
              </button>
            ))}
          </div>

          {/* Quick links */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">Quick links</h2>
            <p className="text-[11px] text-slate-500">
              Jump to your teaching tools
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-5 sm:justify-start sm:gap-6">
              {circularLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => navigate(link.url)}
                  className="flex flex-col items-center gap-2 transition hover:-translate-y-0.5"
                >
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full shadow-sm ring-1 ring-slate-100",
                      link.bg,
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600">
                    {link.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 3-column grid */}
          <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
            <section className="rounded-3xl border border-slate-100 bg-[#FAFBFD] p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Upcoming activities
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Next on your timeline
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/tutor/schedule")}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Calendar
                </button>
              </div>
              {upcomingActivities.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  Nothing scheduled yet.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {upcomingActivities.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigate(item.url)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:shadow-sm"
                      >
                        <div className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-50 text-center leading-none">
                          <span className="text-[9px] font-bold uppercase text-sky-600">
                            {format(item.date, "MMM")}
                          </span>
                          <span className="text-lg font-black text-sky-800">
                            {format(item.date, "d")}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {item.title}
                            </p>
                            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-slate-600">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {item.sub}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 overflow-hidden">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Class health
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Session mix & attendance
                  </p>
                </div>
              </div>
              <Donut
                segments={
                  healthSegments.length
                    ? healthSegments
                    : [{ value: 1, color: "#e2e8f0", label: "No data" }]
                }
                centerLabel={attendanceCenter}
                centerSub="Attendance"
              />
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Category performance
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Sessions vs quiz average
                  </p>
                </div>
              </div>
              {categoryPerformance.length === 0 ? (
                <p className="text-xs text-slate-400">No category data yet</p>
              ) : (
                <ul className="space-y-4">
                  {categoryPerformance.map((row) => (
                    <li key={row.name}>
                      <div className="mb-1.5 flex justify-between text-[11px]">
                        <span className="truncate font-semibold text-slate-700">
                          {row.name}
                        </span>
                        <span className="shrink-0 text-slate-400">
                          {row.sessions} sessions
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-14 text-[9px] font-medium text-sky-600">
                            Sessions
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-300 to-sky-500"
                              style={{ width: `${row.sessionPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-14 text-[9px] font-medium text-violet-600">
                            Quiz avg
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-300 to-violet-500"
                              style={{ width: `${row.quizAvg}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-[9px] font-bold text-slate-600">
                            {row.quizAvg}%
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Alerts + notifications */}
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Attention alerts
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Items that need action
                  </p>
                </div>
              </div>
              {attentionAlerts.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  All clear — no urgent items.
                </p>
              ) : (
                <ul className="space-y-2">
                  {attentionAlerts.map((alert) => {
                    const style = riskStyles[alert.level];
                    return (
                      <li key={alert.id}>
                        <button
                          type="button"
                          onClick={() => navigate(alert.url)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-2xl border border-slate-100 border-l-4 bg-slate-50/50 p-3 text-left transition hover:bg-white hover:shadow-sm",
                            style.border,
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {alert.title}
                              </p>
                              <span
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                  style.badge,
                                )}
                              >
                                {alert.level}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {alert.detail}
                            </p>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-slate-100 bg-[#FAFBFD] p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Notifications
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Payments & teaching updates
                    </p>
                  </div>
                </div>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {unreadCount}
                  </span>
                ) : null}
              </div>
              {boardNotifications.length === 0 ? (
                <p className="text-xs text-slate-400">No notifications yet</p>
              ) : (
                <ul className="space-y-2">
                  {boardNotifications.map((n) => {
                    const visual = getNotificationVisual(n.type);
                    const Icon = visual.icon;
                    return (
                      <li key={n._id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.isRead) void markAsRead(n._id);
                            if (n.link) navigate(n.link);
                          }}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition hover:bg-white hover:shadow-sm",
                            visual.surface,
                            !n.isRead && "border-border/50 shadow-sm",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              visual.iconChip,
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="mb-0.5 flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                {visual.label}
                              </span>
                              <span className="ml-auto text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(n.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "block text-sm text-slate-900",
                                !n.isRead ? "font-bold" : "font-semibold",
                              )}
                            >
                              {n.title}
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                              {n.message}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Weekly rhythm */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Weekly rhythm
                </h2>
                <p className="text-[11px] text-slate-500">
                  Sessions scheduled by weekday
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/tutor/classes")}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                All classes
              </button>
            </div>
            <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
              {weeklyActivity.map((item) => (
                <div
                  key={item.day}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[10px] font-bold text-slate-400">
                    {item.count > 0 ? item.count : ""}
                  </span>
                  <div
                    className={cn(
                      "w-full max-w-[3rem] rounded-xl transition-all duration-300",
                      item.active
                        ? "bg-primary shadow-md shadow-primary/20"
                        : "bg-slate-200 group-hover:bg-slate-300",
                    )}
                    style={{ height: `${item.heightPct}%` }}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      item.active ? "text-primary" : "text-slate-400",
                    )}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="w-full shrink-0 space-y-5 xl:w-[310px] 2xl:w-[320px]">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => navigate("/tutor/profile")}
              className="flex w-full items-center gap-3 rounded-xl text-left transition hover:bg-slate-50"
            >
              <Avatar className="h-11 w-11 border-2 border-primary/20">
                <AvatarImage src={avatarSrc} alt={user?.name} />
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user?.name || "Tutor"}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  View profile
                </p>
              </div>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-bold text-slate-900">
                {format(calendarMonth, "MMMM yyyy")}
              </p>
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold text-slate-400">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={`wd-${i}`}>{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-0.5">
              {Array.from({ length: calendarDays[0].getDay() }).map((_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const hasClass = classDaysSet.has(key);
                const isToday = isSameDay(day, new Date());
                const isSelected =
                  selectedCalendarDay !== null &&
                  isSameDay(day, selectedCalendarDay);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCalendarDay(day);
                      if (hasClass) navigate("/tutor/schedule");
                    }}
                    className={cn(
                      "relative flex h-8 items-center justify-center rounded-full text-[10px] font-semibold transition",
                      isToday && "bg-primary text-primary-foreground shadow-sm",
                      !isToday && isSelected && "bg-primary/15 text-primary",
                      !isToday &&
                        !isSelected &&
                        hasClass &&
                        "bg-sky-50 text-sky-800",
                      !isToday &&
                        !isSelected &&
                        !hasClass &&
                        "text-slate-600 hover:bg-white",
                    )}
                  >
                    {format(day, "d")}
                    {hasClass && !isToday ? (
                      <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Today&apos;s schedule
              </h3>
              <button
                type="button"
                onClick={() => navigate("/tutor/schedule")}
                className="text-[10px] font-bold text-primary"
              >
                Full schedule
              </button>
            </div>
            {todayClasses.length === 0 ? (
              <p className="text-xs text-slate-500">No sessions today.</p>
            ) : (
              <ul className="space-y-2">
                {todayClasses.map((cls) => {
                  const nowBadge = isSessionNow(cls);
                  const accent = timelineAccent(cls);
                  return (
                    <li key={cls._id}>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            cls.status === "live"
                              ? `/tutor/classes/${cls._id}/live`
                              : `/tutor/classes/${cls._id}/analytics`,
                          )
                        }
                        className="flex w-full gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:bg-white hover:shadow-sm"
                        style={{ borderLeftWidth: 4, borderLeftColor: accent }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900">
                              {cls.title}
                            </p>
                            {nowBadge ? (
                              <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                                Now
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            {format(new Date(cls.scheduledDate), "h:mm a")}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                            {cls.category?.name || "General"}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Smart reminders
              </h3>
            </div>
            {smartReminders.length === 0 ? (
              <p className="text-xs text-slate-500">You&apos;re all caught up.</p>
            ) : (
              <ul className="space-y-2">
                {smartReminders.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => navigate(r.url)}
                      className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                        <r.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900">
                          {r.title}
                        </p>
                        <p className="text-[10px] text-slate-500">{r.detail}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-900 p-4 text-white shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Snapshot
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums">
              {completedClasses.length}
            </p>
            <p className="text-xs text-white/75">Completed sessions</p>
            <p className="mt-3 text-[11px] text-white/60">
              {analytics?.totalRecordings ?? 0} recordings ·{" "}
              {analytics?.averageQuizScore ?? 0}% avg quiz
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TutorDashboard;
