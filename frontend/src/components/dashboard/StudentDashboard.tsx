import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  BookOpen,
  Video,
  FileText,
  HeartHandshake,
  TrendingUp,
  PlayCircle,
  Clock,
  Brain as BrainIcon,
  Search,
  MoreHorizontal,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Plus,
  Users,
  Check,
  Trash2,
  Pencil,
  ArrowRight,
  Download,
  Award,
  GraduationCap,
  MessageSquareQuote,
} from "lucide-react";
import OccasionToast from "@/components/occasions/OccasionToast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleDashboardSkeleton } from "@/components/loading/PageSkeleton";
import { useNavigate } from "react-router";
import { withMediaCacheBust } from "@/lib/profileMedia";
import {
  format,
  formatDistanceToNow,
  addDays,
  isSameDay,
  startOfWeek,
} from "date-fns";
import type {
  liveClass,
  assignment,
  recording,
  studentProgress,
} from "@/types";
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

const CircularProgress = ({
  value,
  label,
  sub,
  onClick,
}: {
  value: number;
  label: string;
  sub: string;
  onClick: () => void;
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-full min-w-0 w-full rounded-[1.5rem] border border-black/[0.04] bg-white p-4 text-left shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-[84px] h-[84px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
            <circle
              cx="42"
              cy="42"
              r={r}
              fill="none"
              stroke="#F3F0FF"
              strokeWidth="8"
            />
            <circle
              cx="42"
              cy="42"
              r={r}
              fill="none"
              stroke="#c147e9"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-900 tabular-nums">
            {clamped}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{sub}</p>
          <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            <Check className="w-3 h-3" /> Check
          </span>
        </div>
      </div>
    </button>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingClasses, setUpcomingClasses] = useState<liveClass[]>([]);
  const [assignments, setAssignments] = useState<assignment[]>([]);
  const [recordings, setRecordings] = useState<recording[]>([]);
  const [progress, setProgress] = useState<studentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const fetchDashboardData = useCallback(async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const [classesRes, assignmentsRes, recordingsRes, progressRes] =
        await Promise.all([
          api.get("/classes/upcoming"),
          api.get("/assignments"),
          api.get("/recordings"),
          api.get(`/analytics/student/${user?._id}/progress`),
        ]);

      setUpcomingClasses(classesRes.data.data.classes as liveClass[]);
      setAssignments(assignmentsRes.data.data.assignments as assignment[]);
      setRecordings(recordingsRes.data.data.recordings as recording[]);
      setProgress(progressRes.data.data.analytics as studentProgress);
    } catch (error: unknown) {
      console.error("Failed to load dashboard:", error);
      toast.error(getErrorMessage(error, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const getGreeting = () => {
    if (currentHour < 5) return { label: "Good night", icon: Moon };
    if (currentHour < 12) return { label: "Good morning", icon: Sunrise };
    if (currentHour < 17) return { label: "Good afternoon", icon: Sun };
    if (currentHour < 21) return { label: "Good evening", icon: Sunset };
    return { label: "Good night", icon: Moon };
  };

  const getFirstName = (fullName?: string): string => {
    if (!fullName) return "Explorer";
    return fullName.split(" ")[0];
  };

  const pendingAssignments = assignments.filter(
    (a) => new Date(a.dueDate) >= new Date(),
  );
  const overdueAssignments = assignments.filter(
    (a) => new Date(a.dueDate) < new Date(),
  );

  const liveClasses = upcomingClasses.filter((c) => c.status === "live");
  const readyRecordings = recordings.filter(
    (r) => r.processingStatus === "ready",
  );

  const attendancePercentage = progress?.attendance.percentage || 0;
  const quizAverage = progress?.quizzes.averageScore || 0;
  const completedGoals = progress?.mentorship.completedGoals || 0;
  const totalGoals = progress?.mentorship.totalGoals || 0;
  const activeGoals = progress?.mentorship.activeGoals || 0;
  const submittedAssignments = progress?.assignments.submitted || 0;
  const totalAssignments = progress?.assignments.totalAssignments || 0;
  const assignmentProgress =
    totalAssignments > 0
      ? Math.round((submittedAssignments / totalAssignments) * 100)
      : 0;
  const mentorshipProgress =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const greeting = getGreeting();
  const firstName = getFirstName(user?.name);
  const avatarSrc = withMediaCacheBust(user?.avatar, user?.avatarUpdatedAt);
  const primaryCategory =
    user?.categories?.[0]?.name ||
    user?.assignedCategories?.[0]?.name ||
    "Your program";

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const dayClasses = useMemo(
    () =>
      upcomingClasses.filter((c) =>
        isSameDay(new Date(c.scheduledDate), selectedDay),
      ),
    [upcomingClasses, selectedDay],
  );

  const notifications = useMemo(() => {
    const items: {
      id: string;
      kind: string;
      title: string;
      meta: string;
      url: string;
    }[] = [];

    for (const c of upcomingClasses.slice(0, 2)) {
      items.push({
        id: `n-class-${c._id}`,
        kind: c.status === "live" ? "Live now" : "Upcoming class",
        title: c.title,
        meta: format(new Date(c.scheduledDate), "EEE, MMM d · h:mm a"),
        url: `/live-class/${c._id}`,
      });
    }
    for (const a of [...overdueAssignments, ...pendingAssignments].slice(0, 2)) {
      const due = new Date(a.dueDate);
      items.push({
        id: `n-asg-${a._id}`,
        kind: due < new Date() ? "Overdue" : "Assignment",
        title: a.title,
        meta: `Due ${formatDistanceToNow(due, { addSuffix: true })}`,
        url: "/assignments",
      });
    }
    return items.slice(0, 4);
  }, [upcomingClasses, overdueAssignments, pendingAssignments]);

  const assignmentCards = useMemo(() => {
    return [...assignments]
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 3)
      .map((a) => {
        const due = new Date(a.dueDate);
        const isOverdue = due < new Date();
        const isSoon = due.getTime() - Date.now() < 1000 * 60 * 60 * 48;
        return {
          ...a,
          priority: isOverdue ? "High" : isSoon ? "Medium" : "Low",
        };
      });
  }, [assignments]);

  const todayTasks = [
    {
      title: "Attendance consistency",
      meta: `${progress?.attendance.present || 0}/${progress?.attendance.total || 0} sessions`,
      value: attendancePercentage,
      url: "/progress",
    },
    {
      title: "Quiz performance",
      meta: `${progress?.quizzes.passed || 0}/${progress?.quizzes.totalQuizzes || 0} passed`,
      value: quizAverage,
      url: "/quizzes",
    },
    {
      title: "Assignment submissions",
      meta: `${submittedAssignments}/${totalAssignments || 0} submitted`,
      value: assignmentProgress,
      url: "/assignments",
    },
    {
      title: "Mentorship goals",
      meta: `${completedGoals}/${totalGoals || 0} completed`,
      value: mentorshipProgress,
      url: "/mentorship",
    },
  ];

  const nextLive = liveClasses[0] || upcomingClasses[0];

  const filteredQuickLinks = useMemo(() => {
    const links = [
      { label: "My Learning", url: "/my-learning", icon: BookOpen },
      { label: "Live Classes", url: "/live-classes", icon: Video },
      { label: "Assignments", url: "/assignments", icon: FileText },
      { label: "Quizzes", url: "/quizzes", icon: BrainIcon },
      { label: "Recordings", url: "/recordings", icon: PlayCircle },
      { label: "Mentorship", url: "/mentorship", icon: HeartHandshake },
      { label: "Progress", url: "/progress", icon: TrendingUp },
      { label: "Certificates", url: "/certificates", icon: Award },
      { label: "After Graduation", url: "/after-graduation", icon: GraduationCap },
      { label: "My Testimonial", url: "/my-testimonial", icon: MessageSquareQuote },
      { label: "Community", url: "/community", icon: Users },
    ];
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter((l) => l.label.toLowerCase().includes(q));
  }, [search]);

  if (loading) {
    return <RoleDashboardSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] min-w-0 space-y-5 sm:space-y-6 pb-10 overflow-x-hidden">
      <OccasionToast />
      {/* Top utility bar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-sm font-semibold text-muted-foreground sm:gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Dashboard
          </span>
          <button
            type="button"
            onClick={() => navigate("/my-learning")}
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
          >
            Learning
          </button>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
          >
            Progress
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center xl:justify-end">
          <div className="relative min-w-0 flex-1 sm:max-w-none xl:max-w-md 2xl:max-w-lg">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or type command"
              className="h-10 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/25 focus:outline-none"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/progress")}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 sm:flex-none sm:px-4"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span className="sm:inline">View progress</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/my-learning")}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-indigo-950 px-3 text-xs font-bold text-white transition-colors hover:bg-primary sm:flex-none sm:px-4 dark:bg-primary dark:hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Continue learning
            </button>
          </div>
        </div>
      </div>

      {/* Hero greeting */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-stretch">
        <div className="xl:col-span-5 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src={avatarSrc} alt={user?.name} />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {[0, 1].map((i) => (
                <Avatar key={i} className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className="bg-violet-100 text-violet-700 text-[10px] font-bold">
                    {String.fromCharCode(66 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              {greeting.label}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-black text-gray-900 tracking-tight leading-tight break-words">
            Hi, {firstName}! What are your plans for today?
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-md">
            Stay on top of live classes, assignments, quizzes, and mentorship
            goals in your {primaryCategory} journey on GYGI.
          </p>
        </div>

        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
          {[
            {
              title: "Stay organized",
              sub: "Track assignments & due dates",
              icon: FileText,
              url: "/assignments",
              bg: "from-[#F3E8FF] to-white",
            },
            {
              title: "Sync your learning",
              sub: "Catch up with class recordings",
              icon: PlayCircle,
              url: "/recordings",
              bg: "from-[#EDE9FE] to-white",
            },
            {
              title: "Collaborate",
              sub: "Learn with mentors & peers",
              icon: Users,
              url: "/community",
              bg: "from-[#FCE7F3] to-white",
            },
          ].map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => navigate(card.url)}
              className={cn(
                "rounded-[1.5rem] border border-black/[0.04] bg-gradient-to-br p-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all min-w-0",
                card.bg,
              )}
            >
              <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-primary mb-3 shadow-sm">
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900">{card.title}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                {card.sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 min-w-0">
        {/* Notifications */}
        <section className="lg:col-span-4 xl:col-span-3 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900">Notifications</h2>
            <MoreHorizontal className="w-4 h-4 text-gray-300" />
          </div>
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => navigate(n.url)}
                className="w-full rounded-2xl bg-[#F8F7FC] hover:bg-primary/5 border border-transparent hover:border-primary/15 p-3 text-left transition-colors group min-w-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      {n.kind}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 break-words">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">{n.meta}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <span className="w-7 h-7 rounded-full bg-white text-gray-400 flex items-center justify-center">
                      <Pencil className="w-3 h-3" />
                    </span>
                    <span className="w-7 h-7 rounded-full bg-white text-gray-400 flex items-center justify-center">
                      <Trash2 className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">
                You&apos;re all caught up
              </p>
            )}
          </div>
        </section>

        {/* Assignments */}
        <section className="lg:col-span-4 xl:col-span-4 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900">Assignments</h2>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {pendingAssignments.length} pending
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {assignmentCards.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => navigate("/assignments")}
                className="w-full rounded-2xl border border-gray-100 p-3.5 text-left hover:border-primary/25 hover:shadow-sm transition-all min-w-0"
              >
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 break-words leading-snug">
                  {a.title}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    {a.category?.name || primaryCategory}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold",
                      a.priority === "High" && "bg-rose-100 text-rose-600",
                      a.priority === "Medium" && "bg-amber-100 text-amber-700",
                      a.priority === "Low" && "bg-sky-100 text-sky-700",
                    )}
                  >
                    {a.priority}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400 font-medium">
                    {format(new Date(a.dueDate), "MMM d")}
                  </span>
                </div>
              </button>
            ))}
            {assignmentCards.length === 0 && (
              <p className="text-sm text-gray-400 py-6 text-center">
                No assignments yet
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate("/assignments")}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[#F3E8FF] text-primary text-sm font-bold hover:bg-primary hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            View all assignments
          </button>
        </section>

        {/* Calendar / schedule */}
        <section className="lg:col-span-4 xl:col-span-5 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900">This week</h2>
            <button
              type="button"
              onClick={() => navigate("/calendar")}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Full calendar
            </button>
          </div>

          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {weekDays.map((day) => {
              const active = isSameDay(day, selectedDay);
              const hasClass = upcomingClasses.some((c) =>
                isSameDay(new Date(c.scheduledDate), day),
              );
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[44px] h-14 sm:h-16 rounded-2xl text-center transition-all shrink-0",
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-[#F8F7FC] text-gray-600 hover:bg-primary/10",
                  )}
                >
                  <span className="text-[10px] font-semibold opacity-80">
                    {format(day, "EEE")}
                  </span>
                  <span className="text-sm font-black tabular-nums">
                    {format(day, "d")}
                  </span>
                  {hasClass && !active && (
                    <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 relative pl-3 space-y-4">
            <div className="absolute left-[18px] top-2 bottom-2 border-l border-dashed border-primary/25" />
            {(dayClasses.length > 0 ? dayClasses : upcomingClasses.slice(0, 3)).map(
              (c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => navigate(`/live-class/${c._id}`)}
                  className="relative w-full flex items-start gap-3 text-left min-w-0 group"
                >
                  <span className="relative z-10 mt-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white shrink-0" />
                  <div className="min-w-0 flex-1 rounded-2xl bg-[#F8F7FC] group-hover:bg-primary/5 p-3 transition-colors">
                    <p className="text-[10px] font-bold text-primary tabular-nums">
                      {format(new Date(c.scheduledDate), "h:mm a")}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 break-words">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {c.status === "live" ? "Live now" : "Scheduled class"}
                    </p>
                  </div>
                </button>
              ),
            )}
            {dayClasses.length === 0 && upcomingClasses.length === 0 && (
              <p className="text-sm text-gray-400 pl-5 py-4">
                No classes scheduled
              </p>
            )}
          </div>
        </section>

        {/* Today tasks */}
        <section className="lg:col-span-7 xl:col-span-5 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900">Today&apos;s focus</h2>
            <Clock className="w-4 h-4 text-gray-300" />
          </div>
          <div className="space-y-4">
            {todayTasks.map((task) => (
              <button
                key={task.title}
                type="button"
                onClick={() => navigate(task.url)}
                className="w-full text-left min-w-0 group"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {task.meta}
                    </p>
                  </div>
                  <span className="text-xs font-black text-gray-900 tabular-nums shrink-0">
                    {task.value}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, task.value)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Mentorship CTA (premium-style) */}
        <section className="lg:col-span-5 xl:col-span-3 rounded-[1.75rem] bg-primary text-white p-5 shadow-xl shadow-primary/25 min-w-0 flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
            Mentorship
          </p>
          <h3 className="mt-2 text-lg font-black leading-snug">
            Grow faster with your GYGI mentor
          </h3>
          <p className="mt-2 text-sm text-white/80 leading-relaxed flex-1">
            {totalGoals > 0
              ? `${completedGoals} of ${totalGoals} goals done · ${activeGoals} active.`
              : "Set goals, get feedback, and stay accountable."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/mentorship")}
            className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-indigo-950 text-white text-sm font-bold hover:bg-black transition-colors"
          >
            Open mentorship
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

        {/* Circular progress + next session + testimonial — one full desktop row */}
        <div className="lg:col-span-6 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <CircularProgress
            value={attendancePercentage}
            label="Attendance"
            sub={
              attendancePercentage >= 75
                ? "You are on track"
                : "Boost your consistency"
            }
            onClick={() => navigate("/progress")}
          />
          <CircularProgress
            value={quizAverage}
            label="Quiz average"
            sub={`${progress?.quizzes.passed || 0} quizzes passed`}
            onClick={() => navigate("/quizzes")}
          />
        </div>

        {/* Next class invite card */}
        <section className="lg:col-span-6 xl:col-span-4 rounded-[1.75rem] bg-white border border-black/[0.04] shadow-sm p-4 sm:p-5 min-w-0 flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Next session
          </p>
          {nextLive ? (
            <>
              <h3 className="mt-2 text-base font-black text-gray-900 leading-snug line-clamp-2 break-words">
                {nextLive.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {format(new Date(nextLive.scheduledDate), "EEEE, MMM d · h:mm a")}
                {nextLive.status === "live" ? " · Live now" : ""}
              </p>
              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/live-classes")}
                  className="flex-1 min-w-[120px] h-10 rounded-full bg-gray-50 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  Reschedule view
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/live-class/${nextLive._id}`)}
                  className="flex-1 min-w-[120px] h-10 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  {nextLive.status === "live" ? "Join class" : "Open class"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-base font-black text-gray-900">
                No upcoming class
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Check recordings while you wait for the next live session.
              </p>
              <button
                type="button"
                onClick={() => navigate("/recordings")}
                className="mt-auto pt-4 w-full h-10 rounded-full bg-primary text-white text-xs font-bold"
              >
                Browse recordings ({readyRecordings.length})
              </button>
            </>
          )}
        </section>

        {/* Share testimonial CTA */}
        <section className="lg:col-span-12 xl:col-span-4 rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-fuchsia-50 p-5 shadow-sm min-w-0 flex flex-col dark:via-card dark:to-primary/5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
            Impact story
          </p>
          <h3 className="mt-2 text-lg font-black leading-snug text-slate-900 dark:text-foreground">
            Share your GYGI testimonial
          </h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1 dark:text-muted-foreground">
            Publish your story to the home page Testimonials section so others
            can learn from your journey.
          </p>
          <button
            type="button"
            onClick={() => navigate("/my-testimonial")}
            className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Write my testimonial
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>

      {/* Quick command results / shortcuts */}
      {search.trim() && (
        <div className="rounded-[1.5rem] bg-white border border-black/[0.04] shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 mb-3">Quick jump</p>
          <div className="flex flex-wrap gap-2">
            {filteredQuickLinks.map((l) => (
              <button
                key={l.url}
                type="button"
                onClick={() => navigate(l.url)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F8F7FC] hover:bg-primary hover:text-white text-xs font-semibold text-gray-700 transition-colors"
              >
                <l.icon className="w-3.5 h-3.5" />
                {l.label}
              </button>
            ))}
            {filteredQuickLinks.length === 0 && (
              <p className="text-sm text-gray-400">No matches</p>
            )}
          </div>
        </div>
      )}

      {!search.trim() && (
        <div className="flex flex-wrap gap-2">
          {filteredQuickLinks.map((l) => (
            <button
              key={l.url}
              type="button"
              onClick={() => navigate(l.url)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-gray-200 hover:border-primary/40 hover:text-primary text-xs font-semibold text-gray-600 transition-colors"
            >
              <l.icon className="w-3.5 h-3.5" />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
