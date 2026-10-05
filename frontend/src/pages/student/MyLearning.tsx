import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  BookOpen,
  ChevronRight,
  Video,
  FileQuestion,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  PlayCircle,
  Award,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router";
import type { Enrollment } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import CategorySwitchDialog from "@/components/learning/CategorySwitchDialog";

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

const formatDeadline = (iso?: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const MyLearning = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchOpen, setSwitchOpen] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/enrollments/me");
      setEnrollments((data.data.enrollments as Enrollment[]) || []);
    } catch (error: unknown) {
      console.error("Failed to load enrollments:", error);
      toast.error(getErrorMessage(error, "Failed to load your learning"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const activeEnrollment = useMemo(
    () => enrollments.find((e) => e.status === "active") || null,
    [enrollments],
  );
  const activeCategory = activeEnrollment?.category;
  const activeCategoryId =
    typeof activeCategory === "object" && activeCategory
      ? activeCategory._id
      : null;
  const activeCategoryName =
    typeof activeCategory === "object" && activeCategory
      ? activeCategory.name
      : null;

  const completedCount = enrollments.filter(
    (e) => e.status === "completed",
  ).length;
  const avgProgress =
    enrollments.length === 0
      ? 0
      : Math.round(
          enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) /
            enrollments.length,
        );

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            My Learning
          </h1>
          <p className="mt-1 max-w-md text-sm leading-snug text-gray-500">
            Your enrolled categories and progress
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full items-center justify-center gap-1.5 rounded-full sm:h-9 sm:w-auto"
            onClick={() => setSwitchOpen(true)}
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span className="truncate">Request category change</span>
          </Button>
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <Button
              variant="outline"
              size="sm"
              className="h-10 items-center justify-center gap-1.5 rounded-full sm:h-9 sm:w-auto"
              onClick={() => navigate("/certificates")}
            >
              <Award className="h-4 w-4 shrink-0" />
              Certificates
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 items-center justify-center gap-1.5 rounded-full sm:h-9 sm:w-auto"
              onClick={() => navigate("/categories")}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">Browse</span>
              <span className="hidden sm:inline">Browse Categories</span>
            </Button>
          </div>
        </div>
      </header>

      <CategorySwitchDialog
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        currentCategoryId={activeCategoryId}
        currentCategoryName={activeCategoryName}
        onSwitched={() => {
          void fetchEnrollments();
        }}
      />

      {enrollments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700">
            <span className="font-bold">{enrollments.length}</span>
            <span className="text-xs text-gray-500">Enrolled</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-bold">{completedCount}</span>
            <span className="text-xs text-green-600">Completed</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-bold">{avgProgress}%</span>
            <span className="text-xs text-blue-600">Avg Progress</span>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E8E1F8] to-[#FCECEF] p-6 min-h-[100px] flex items-center">
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="max-w-md">
            <h2 className="text-lg font-bold text-[#1A1A1E] mb-1">
              Your learning journey starts here
            </h2>
            <p className="text-sm text-[#5A5A62] mb-3">
              Complete attendance, quizzes, and assignments to earn your
              category certificate.
            </p>
            <button
              onClick={() => navigate("/certificates")}
              className="bg-[#1C1C21] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md hover:bg-black transition-all flex items-center gap-1.5"
            >
              View Certificates <Award className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          title="No categories enrolled"
          description="Choose a learning category to unlock community, classes, and mentorship"
          icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
          actionLabel="Choose category"
          onAction={() => setSwitchOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => {
            const category = enrollment.category;
            if (!category) return null;

            const progressValue = Math.min(100, Math.round(enrollment.progress || 0));
            const breakdown = enrollment.breakdown;
            const deadline = formatDeadline(
              enrollment.phaseEndsAt || breakdown?.phaseEndsAt,
            );
            const isPastDeadline = breakdown?.isPastDeadline;
            const isCompleted = enrollment.status === "completed";

            return (
              <button
                key={enrollment._id}
                onClick={() => navigate("/progress")}
                className="group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-left"
              >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      {category.icon ? (
                        <span className="text-lg">{category.icon}</span>
                      ) : (
                        <BookOpen className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  ) : isPastDeadline ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Deadline passed
                    </span>
                  ) : deadline ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                      <Clock className="w-3 h-3" />
                      Due {deadline}
                    </span>
                  ) : null}
                  {category.durationWeeks ? (
                    <span className="text-gray-400">
                      {category.durationWeeks}-week phase
                    </span>
                  ) : null}
                </div>

                {breakdown && (
                  <div className="grid grid-cols-3 gap-2 mb-3 text-[10px] text-gray-500">
                    <div>
                      <p className="font-semibold text-gray-700">
                        {breakdown.attendance.attended}/{breakdown.attendance.total}
                      </p>
                      <p>Attendance</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        {breakdown.quizzes.passed}/{breakdown.quizzes.total}
                      </p>
                      <p>Quizzes</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        {breakdown.assignments.submitted}/
                        {breakdown.assignments.total}
                      </p>
                      <p>Assignments</p>
                    </div>
                  </div>
                )}

                <Progress
                  value={progressValue}
                  className="h-1.5 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-purple-400"
                />

                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {progressValue}% Complete
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/live-classes?category=${category._id}`);
                      }}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Live Classes"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/recordings?category=${category._id}`);
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                      title="Recordings"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quizzes?category=${category._id}`);
                      }}
                      className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                      title="Quizzes"
                    >
                      <FileQuestion className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {enrollments.length > 0 && (
        <div className="rounded-2xl bg-[#1C1C21] text-white p-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Want to learn more?</p>
              <p className="text-xs text-gray-400">
                Explore additional categories and expand your skills
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/categories")}
            className="bg-white text-gray-900 rounded-full px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors shrink-0 flex items-center gap-1.5"
          >
            Explore <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyLearning;
