import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowUpRight,
  Search,
  AlertTriangle,
  Zap,
  Award,
  Upload,
  Github,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";
import type { assignment } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import {
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  isTomorrow,
} from "date-fns";
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

const Assignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "overdue" | "submitted"
  >("all");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/assignments");
      setAssignments(data.data.assignments as assignment[]);
    } catch (error: unknown) {
      console.error("Failed to load assignments:", error);
      toast.error(getErrorMessage(error, "Failed to load assignments"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const pendingAssignments = assignments.filter(
    (a) => new Date(a.dueDate) >= new Date(),
  );
  const overdueAssignments = assignments.filter(
    (a) => new Date(a.dueDate) < new Date(),
  );

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.category?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      assignment.tutor?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const isOverdue = new Date(assignment.dueDate) < new Date();
    const isPending = !isOverdue;

    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && isPending) ||
      (filter === "overdue" && isOverdue) ||
      (filter === "submitted" &&
        "status" in assignment &&
        assignment.status === "submitted");

    return matchesSearch && matchesFilter;
  });

  const getDueDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isPast(date)) return "Overdue";
    if (isToday(date)) return "Due Today";
    if (isTomorrow(date)) return "Due Tomorrow";
    return format(date, "MMM d");
  };

  const getSubmissionTypeIcon = (type: string) => {
    switch (type) {
      case "file":
        return <Upload className="w-3.5 h-3.5" />;
      case "github_url":
        return <Github className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30 sm:h-11 sm:w-11">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black text-gray-900 sm:text-2xl">
              Assignments
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Complete and submit your assignments
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {overdueAssignments.length > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs px-3 py-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {overdueAssignments.length} Overdue
            </Badge>
          )}
          <Badge className="bg-primary/10 text-primary text-xs px-3 py-1">
            {pendingAssignments.length} Pending
          </Badge>
        </div>
      </header>

      {/* ============================================ */}
      {/* STATS BAR */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {assignments.length}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {pendingAssignments.length}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-gray-500">Overdue</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {overdueAssignments.length}
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-500">
              Submitted
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {assignments.length -
              pendingAssignments.length -
              overdueAssignments.length}
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* FILTER & SEARCH BAR */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative order-first w-full sm:order-last sm:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full pl-11 pr-4 bg-white border-[#E5E7EB] rounded-xl shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20 sm:h-10 sm:rounded-full"
          />
        </div>
        <div className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-white p-1 border border-[#E5E7EB] shadow-sm sm:flex sm:w-auto sm:rounded-full">
          {[
            { id: "all" as const, label: "All", count: assignments.length },
            {
              id: "pending" as const,
              label: "Pending",
              count: pendingAssignments.length,
            },
            {
              id: "overdue" as const,
              label: "Overdue",
              count: overdueAssignments.length,
            },
            {
              id: "submitted" as const,
              label: "Submitted",
              count:
                assignments.length -
                pendingAssignments.length -
                overdueAssignments.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "min-w-0 px-2 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap sm:px-4",
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
      </div>

      {/* ============================================ */}
      {/* OVERDUE BANNER */}
      {/* ============================================ */}
      {overdueAssignments.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 p-5 shadow-lg shadow-red-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span className="text-white font-bold text-sm uppercase tracking-wider">
                Overdue Assignments
              </span>
            </div>
            <p className="text-white/90 text-xs mb-3">
              You have {overdueAssignments.length} assignment
              {overdueAssignments.length > 1 ? "s" : ""} past due. Complete them
              as soon as possible.
            </p>
            <button
              onClick={() => setFilter("overdue")}
              className="bg-white text-red-600 font-bold text-xs px-4 py-2 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              View Overdue
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ASSIGNMENTS GRID */}
      {/* ============================================ */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          description={
            searchQuery
              ? `No results for "${searchQuery}"`
              : "Assignments will appear here once assigned"
          }
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            const dueDate = new Date(assignment.dueDate);
            const timeUntil = formatDistanceToNow(dueDate, { addSuffix: true });

            return (
              <button
                key={assignment._id}
                onClick={() => navigate(`/assignments/${assignment._id}`)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5",
                  isOverdue
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg shadow-red-500/10"
                    : "border-[#E5E7EB] bg-white shadow-sm hover:shadow-lg",
                )}
              >
                {/* Status Bar */}
                <div
                  className={cn(
                    "h-1 w-full",
                    isOverdue
                      ? "bg-gradient-to-r from-red-500 to-rose-500"
                      : "bg-gradient-to-r from-primary to-purple-400",
                  )}
                />

                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "p-2 rounded-xl",
                          isOverdue
                            ? "bg-red-500/10 text-red-500"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {getSubmissionTypeIcon(
                          assignment.submissionTypes[0] || "text",
                        )}
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          isOverdue
                            ? "bg-red-100 text-red-700"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {isOverdue ? "Overdue" : "Pending"}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                    {assignment.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {assignment.maxScore} pts
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {getDueDateLabel(assignment.dueDate)}
                    </span>
                  </div>

                  {/* Tutor Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      {assignment.tutor?.name?.charAt(0) || "T"}
                    </div>
                    <span className="text-xs text-gray-500">
                      {assignment.tutor?.name || "Tutor"}
                    </span>
                  </div>

                  {/* Time Until */}
                  <p
                    className={cn(
                      "text-[10px] font-medium",
                      isOverdue ? "text-red-500" : "text-primary/60",
                    )}
                  >
                    {isOverdue ? "Past due!" : timeUntil}
                  </p>

                  {/* Action Button */}
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    {isOverdue ? (
                      <span className="inline-flex items-center justify-center w-full py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Submit Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-full py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                        View Details
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
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
      {assignments.length > 0 && (
        <div className="rounded-2xl bg-[#1C1C21] text-white p-5 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Stay on top of deadlines!</p>
              <p className="text-xs text-gray-400">
                Submit assignments early to avoid last-minute stress
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/calendar")}
            className="bg-white text-gray-900 rounded-full px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors shrink-0 flex items-center gap-1.5"
          >
            View Calendar
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Assignments;
