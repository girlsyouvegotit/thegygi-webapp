import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  FileQuestion,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Search,
  Brain,
  Target,
  Award,
  CheckCircle2,
  Zap,
  Flame,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";
import type { quiz } from "@/types";
import EmptyState from "@/components/global/EmptyState";
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

const Quizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/quizzes");
      setQuizzes(data.data.quizzes as quiz[]);
    } catch (error: unknown) {
      console.error("Failed to load quizzes:", error);
      toast.error(getErrorMessage(error, "Failed to load quizzes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const activeQuizzes = quizzes.filter((q) => q.isActive);
  const completedQuizzes = quizzes.filter((q) => !q.isActive);
  const liveQuizzes = quizzes.filter((q) => q.isLiveQuiz);

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.tutor?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && quiz.isActive) ||
      (filter === "completed" && !quiz.isActive);

    return matchesSearch && matchesFilter;
  });

  const totalQuestions = quizzes.reduce(
    (sum, q) => sum + q.questions.length,
    0,
  );

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Quizzes</h1>
            <p className="text-sm text-gray-500">Test your knowledge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveQuizzes.length > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs px-3 py-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
              {liveQuizzes.length} Live
            </Badge>
          )}
          <Badge className="bg-primary/10 text-primary text-xs px-3 py-1">
            {quizzes.length} Total
          </Badge>
        </div>
      </header>

      {/* ============================================ */}
      {/* STATS BAR */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-gray-500">
              Total Quizzes
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">{quizzes.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {activeQuizzes.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-gray-500">
              Questions
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalQuestions}</p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-gray-500">
              Avg Pass Mark
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {quizzes.length > 0
              ? Math.round(
                  quizzes.reduce((sum, q) => sum + q.passingScore, 0) /
                    quizzes.length,
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* FILTER & SEARCH BAR */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-[#E5E7EB] shadow-sm">
          {[
            { id: "all" as const, label: "All", count: quizzes.length },
            {
              id: "active" as const,
              label: "Active",
              count: activeQuizzes.length,
            },
            {
              id: "completed" as const,
              label: "Completed",
              count: completedQuizzes.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                filter === tab.id
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-gray-500 hover:bg-gray-50",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-[9px]",
                  filter === tab.id ? "bg-white/20" : "bg-gray-100",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-[#E5E7EB] rounded-full h-10"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* LIVE QUIZ BANNER */}
      {/* ============================================ */}
      {liveQuizzes.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 p-5 shadow-lg shadow-red-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span className="text-white font-bold text-sm uppercase tracking-wider">
                Live Quiz Available
              </span>
            </div>
            <p className="text-white/90 text-xs mb-3">
              Join the live quiz session now!
            </p>
            {liveQuizzes.slice(0, 1).map((quiz) => (
              <button
                key={quiz._id}
                onClick={() => navigate(`/quizzes/${quiz._id}`)}
                className="bg-white text-red-600 font-bold text-xs px-4 py-2 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Start {quiz.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* QUIZ CARDS GRID */}
      {/* ============================================ */}
      {filteredQuizzes.length === 0 ? (
        <EmptyState
          title="No quizzes found"
          description={
            searchQuery
              ? `No results for "${searchQuery}"`
              : "Quizzes will appear here once assigned"
          }
          icon={<FileQuestion className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => {
            const isLive = quiz.isLiveQuiz;
            const isActive = quiz.isActive;
            const isPast = !isActive;

            return (
              <button
                key={quiz._id}
                onClick={() => navigate(`/quizzes/${quiz._id}`)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5",
                  isLive
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg shadow-red-500/10"
                    : isPast
                      ? "border-[#E5E7EB] bg-gray-50 shadow-sm hover:shadow-md"
                      : "border-[#E5E7EB] bg-white shadow-sm hover:shadow-lg",
                )}
              >
                {/* Status Bar */}
                <div
                  className={cn(
                    "h-1 w-full",
                    isLive
                      ? "bg-gradient-to-r from-red-500 to-rose-500"
                      : isActive
                        ? "bg-gradient-to-r from-primary to-purple-400"
                        : "bg-gradient-to-r from-gray-300 to-gray-400",
                  )}
                />

                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "p-2 rounded-xl",
                          isLive
                            ? "bg-red-500/10 text-red-500"
                            : isActive
                              ? "bg-primary/10 text-primary"
                              : "bg-gray-200 text-gray-500",
                        )}
                      >
                        <FileQuestion className="w-4 h-4" />
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          isLive
                            ? "bg-red-100 text-red-700 animate-pulse"
                            : isPast
                              ? "bg-gray-100 text-gray-500"
                              : "bg-primary/10 text-primary",
                        )}
                      >
                        {isLive ? "Live" : isPast ? "Ended" : "Active"}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                    {quiz.description || "No description"}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-3.5 h-3.5" />
                      {quiz.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {quiz.duration} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {quiz.passingScore}%
                    </span>
                  </div>

                  {/* Category & time limit */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{quiz.category?.name}</span>
                    <span>{quiz.duration} min limit</span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-[#E5E7EB]">
                    {isLive ? (
                      <span className="inline-flex items-center justify-center w-full py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                        <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                        Join Live Quiz
                      </span>
                    ) : isActive && !isPast ? (
                      <span className="inline-flex items-center justify-center w-full py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                        Start Quiz
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-full py-2 rounded-full bg-gray-100 text-gray-400 text-xs font-semibold">
                        View Results
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ============================================ */}
      {/* BOTTOM CTA */}
      {/* ============================================ */}
      {quizzes.length > 0 && (
        <div className="rounded-2xl bg-[#1C1C21] text-white p-5 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Challenge yourself!</p>
              <p className="text-xs text-gray-400">
                Regular quizzes help reinforce your learning
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/quizzes")}
            className="bg-white text-gray-900 rounded-full px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors shrink-0 flex items-center gap-1.5"
          >
            View All Quizzes
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Quizzes;
