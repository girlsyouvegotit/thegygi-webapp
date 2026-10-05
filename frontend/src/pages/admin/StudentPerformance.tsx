import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  GraduationCap,
  TrendingUp,
  CalendarCheck,
  Brain,
  FileText,
  FolderTree,
  Loader2,
  ChevronRight,
  X,
  Users,
  Target,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import EmptyState from "@/components/global/EmptyState";
import { cn } from "@/lib/utils";
import type {
  category,
  studentPerformanceRow,
  studentsPerformanceResponse,
  studentsPerformanceSummary,
} from "@/types";

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

type SortKey = "overall" | "name" | "attendance" | "quizzes" | "assignments";

const scoreTone = (score: number) => {
  if (score >= 80) return "text-emerald-600 bg-emerald-500/10";
  if (score >= 60) return "text-amber-600 bg-amber-500/10";
  if (score > 0) return "text-rose-600 bg-rose-500/10";
  return "text-muted-foreground bg-muted";
};

const StudentPerformance = () => {
  const [students, setStudents] = useState<studentPerformanceRow[]>([]);
  const [summary, setSummary] = useState<studentsPerformanceSummary | null>(
    null,
  );
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("overall");
  const [selected, setSelected] = useState<studentPerformanceRow | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories((data.data?.categories as category[]) || []);
    } catch {
      // Non-blocking — filter still works without category list
    }
  }, []);

  const fetchPerformance = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (categoryId !== "all") params.categoryId = categoryId;

        const { data } = await api.get("/analytics/admin/students-performance", {
          params,
        });
        const payload = data.data as studentsPerformanceResponse;
        setStudents(payload.students || []);
        setSummary(payload.summary || null);
      } catch (error: unknown) {
        console.error("Failed to load student performance:", error);
        toast.error(getErrorMessage(error, "Failed to load student performance"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, categoryId],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const sortedStudents = useMemo(() => {
    const rows = [...students];
    rows.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "attendance":
          return b.attendance.percentage - a.attendance.percentage;
        case "quizzes":
          return b.quizzes.averageScore - a.quizzes.averageScore;
        case "assignments":
          return b.assignments.averageScore - a.assignments.averageScore;
        case "overall":
        default:
          return b.overallScore - a.overallScore;
      }
    });
    return rows;
  }, [students, sortBy]);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const summaryCards = [
    {
      label: "Students",
      value: summary?.totalStudents ?? 0,
      icon: Users,
      tone: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Avg overall",
      value: `${summary?.averageOverallScore ?? 0}%`,
      icon: TrendingUp,
      tone: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Avg attendance",
      value: `${summary?.averageAttendance ?? 0}%`,
      icon: CalendarCheck,
      tone: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Avg quiz",
      value: `${summary?.averageQuizScore ?? 0}%`,
      icon: Brain,
      tone: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Avg assignment",
      value: `${summary?.averageAssignmentScore ?? 0}%`,
      icon: FileText,
      tone: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <div className="min-w-0 bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto max-w-7xl min-w-0 space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <GraduationCap className="h-3.5 w-3.5" />
              Platform-wide
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Student Performance
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              View every student&apos;s attendance, quizzes, assignments, and
              mentorship progress across all categories and courses.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPerformance(true)}
            disabled={refreshing || loading}
            className="rounded-full"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="min-w-0 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur sm:p-4"
            >
              <div
                className={cn(
                  "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl",
                  card.tone,
                )}
              >
                <card.icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums">
                {loading ? "—" : card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur sm:p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="rounded-full pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:contents">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 w-full min-w-0 rounded-full border border-input bg-background px-3 text-sm lg:w-auto"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="h-10 w-full min-w-0 rounded-full border border-input bg-background px-3 text-sm lg:w-auto"
          >
            <option value="overall">Sort: overall</option>
            <option value="name">Sort: name</option>
            <option value="attendance">Sort: attendance</option>
            <option value="quizzes">Sort: quizzes</option>
            <option value="assignments">Sort: assignments</option>
          </select>
          </div>
          {(search || categoryId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full self-start"
              onClick={() => {
                setSearch("");
                setCategoryId("all");
              }}
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedStudents.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
            title="No students found"
            description="Try a different search or category filter."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Categories</th>
                      <th className="px-4 py-3 font-medium">Attendance</th>
                      <th className="px-4 py-3 font-medium">Quizzes</th>
                      <th className="px-4 py-3 font-medium">Assignments</th>
                      <th className="px-4 py-3 font-medium">Goals</th>
                      <th className="px-4 py-3 font-medium">Overall</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student) => (
                      <tr
                        key={student._id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelected(student)}
                            className="flex items-center gap-3 text-left"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback>
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {student.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {student.email}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex max-w-[200px] flex-wrap gap-1">
                            {student.categories.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            ) : (
                              student.categories.slice(0, 2).map((name) => (
                                <Badge
                                  key={name}
                                  variant="secondary"
                                  className="rounded-full text-[10px] font-normal"
                                >
                                  {name}
                                </Badge>
                              ))
                            )}
                            {student.categories.length > 2 && (
                              <Badge
                                variant="outline"
                                className="rounded-full text-[10px]"
                              >
                                +{student.categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {student.attendance.percentage}%
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({student.attendance.present}/
                            {student.attendance.total})
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {student.quizzes.averageScore}%
                          <span className="ml-1 text-xs text-muted-foreground">
                            · {student.quizzes.passed}/
                            {student.quizzes.totalQuizzes} passed
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {student.assignments.averageScore}%
                          <span className="ml-1 text-xs text-muted-foreground">
                            · {student.assignments.graded}/
                            {student.assignments.totalAssignments} graded
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {student.mentorship.completedGoals}/
                          {student.mentorship.totalGoals}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                              scoreTone(student.overallScore),
                            )}
                          >
                            {student.overallScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setSelected(student)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {sortedStudents.map((student) => (
                <button
                  key={student._id}
                  type="button"
                  onClick={() => setSelected(student)}
                  className="w-full rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{student.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                            scoreTone(student.overallScore),
                          )}
                        >
                          {student.overallScore}%
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-muted/50 px-2 py-2">
                          <p className="text-muted-foreground">Attend</p>
                          <p className="font-semibold tabular-nums">
                            {student.attendance.percentage}%
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/50 px-2 py-2">
                          <p className="text-muted-foreground">Quiz</p>
                          <p className="font-semibold tabular-nums">
                            {student.quizzes.averageScore}%
                          </p>
                        </div>
                        <div className="rounded-xl bg-muted/50 px-2 py-2">
                          <p className="text-muted-foreground">Assign</p>
                          <p className="font-semibold tabular-nums">
                            {student.assignments.averageScore}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-md"
        >
          {selected && (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-3 pr-6">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selected.avatar} />
                    <AvatarFallback>
                      {getInitials(selected.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <SheetTitle className="truncate text-lg">
                      {selected.name}
                    </SheetTitle>
                    <SheetDescription className="truncate">
                      {selected.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 p-4">
                <div
                  className={cn(
                    "rounded-2xl p-4 text-center",
                    scoreTone(selected.overallScore),
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                    Overall score
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums">
                    {selected.overallScore}%
                  </p>
                </div>

                <section className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                    Categories & courses
                  </h3>
                  {selected.enrollments.length === 0 &&
                  selected.categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No category enrollments yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selected.enrollments.length > 0
                        ? selected.enrollments.map((enrollment) => (
                            <div
                              key={`${enrollment.categoryId}-${enrollment.status}`}
                              className="rounded-xl border border-border/60 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium">
                                  {enrollment.categoryName}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="rounded-full capitalize"
                                >
                                  {enrollment.status}
                                </Badge>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${Math.min(100, enrollment.progress)}%`,
                                  }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {enrollment.progress}% progress
                              </p>
                            </div>
                          ))
                        : selected.categories.map((name) => (
                            <Badge
                              key={name}
                              variant="secondary"
                              className="mr-1 rounded-full"
                            >
                              {name}
                            </Badge>
                          ))}
                    </div>
                  )}
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <MetricTile
                    icon={CalendarCheck}
                    label="Attendance"
                    value={`${selected.attendance.percentage}%`}
                    detail={`${selected.attendance.present} present · ${selected.attendance.late} late · ${selected.attendance.absent} absent`}
                  />
                  <MetricTile
                    icon={Brain}
                    label="Quizzes"
                    value={`${selected.quizzes.averageScore}%`}
                    detail={`${selected.quizzes.passed}/${selected.quizzes.totalQuizzes} passed`}
                  />
                  <MetricTile
                    icon={FileText}
                    label="Assignments"
                    value={`${selected.assignments.averageScore}%`}
                    detail={`${selected.assignments.graded} graded · ${selected.assignments.submitted} submitted`}
                  />
                  <MetricTile
                    icon={Target}
                    label="Mentorship"
                    value={`${selected.mentorship.completionRate}%`}
                    detail={`${selected.mentorship.completedGoals}/${selected.mentorship.totalGoals} goals · ${selected.mentorship.activeGoals} active`}
                  />
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

export default StudentPerformance;
