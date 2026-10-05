import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  PlayCircle,
  Clock,
  Search,
  ChevronRight,
  CheckCircle2,
  Eye,
  ListVideo,
  Grid,
  LayoutList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import RecordingList from "@/components/recordings/RecordingList";
import EmptyState from "@/components/global/EmptyState";
import type { recording } from "@/types";
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

const Recordings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTutor = user?.role === "tutor";
  const watchBasePath = isTutor ? "/tutor/recordings" : "/recordings";
  const [recordings, setRecordings] = useState<recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "processing">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/recordings?limit=100");
      setRecordings(data.data.recordings as recording[]);
    } catch (error: unknown) {
      console.error("Failed to load recordings:", error);
      toast.error(getErrorMessage(error, "Failed to load recordings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const readyRecordings = recordings.filter(
    (r) => r.processingStatus === "ready",
  );
  const processingRecordings = recordings.filter(
    (r) =>
      r.processingStatus === "processing" || r.processingStatus === "pending",
  );

  const filteredRecordings = recordings.filter((recording) => {
    const matchesSearch =
      recording.classId?.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      false ||
      recording.tutor?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      false ||
      recording.category?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      false;

    const matchesFilter =
      filter === "all" ||
      (filter === "ready" && recording.processingStatus === "ready") ||
      (filter === "processing" &&
        (recording.processingStatus === "processing" ||
          recording.processingStatus === "pending"));

    return matchesSearch && matchesFilter;
  });

  const totalViews = recordings.reduce((sum, r) => sum + (r.viewCount || 0), 0);
  const totalDuration = recordings.reduce(
    (sum, r) => sum + (r.duration || 0),
    0,
  );

  const statCards = [
    {
      label: "Total Recordings",
      value: recordings.length,
      icon: ListVideo,
      chip: "bg-primary/10 text-primary",
    },
    {
      label: "Total Views",
      value: totalViews,
      icon: Eye,
      chip: "bg-violet-100 text-violet-600",
    },
    {
      label: "Total Duration",
      value: `${Math.round(totalDuration / 60)} mins`,
      icon: Clock,
      chip: "bg-amber-100 text-amber-700",
    },
    {
      label: "Ready to Watch",
      value: readyRecordings.length,
      icon: CheckCircle2,
      chip: "bg-emerald-100 text-emerald-700",
    },
  ];

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {isTutor ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Tutor portal
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
              Library
            </span>
          )}
          <h1 className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Recordings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isTutor
              ? "Review and share recordings from your live sessions"
              : "Watch past class recordings from your categories"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full border-0 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {readyRecordings.length} Ready
          </Badge>
          {processingRecordings.length > 0 && (
            <Badge className="rounded-full border-0 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {processingRecordings.length} Processing
            </Badge>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div
              className={cn(
                "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl",
                stat.chip,
              )}
            >
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black tabular-nums text-slate-900">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 rounded-full border border-slate-100 bg-[#FAFBFD] p-1">
            {[
              { id: "all" as const, label: "All", count: recordings.length },
              {
                id: "ready" as const,
                label: "Ready",
                count: readyRecordings.length,
              },
              {
                id: "processing" as const,
                label: "Processing",
                count: processingRecordings.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-semibold transition-all sm:px-4",
                  filter === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-800",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]",
                    filter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 text-slate-600",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-[#FAFBFD] pl-9"
            />
          </div>

          <div className="flex items-center gap-1 self-end rounded-full border border-slate-100 bg-[#FAFBFD] p-1 sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-full p-2 transition-all",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:bg-white hover:text-slate-600",
              )}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-full p-2 transition-all",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:bg-white hover:text-slate-600",
              )}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {processingRecordings.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-950">
                {processingRecordings.length} recording
                {processingRecordings.length > 1 ? "s" : ""} processing
              </p>
              <p className="text-xs text-amber-800/80">
                AI is generating summaries, chapters, and practice questions
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-amber-400"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {filteredRecordings.length === 0 ? (
        <EmptyState
          title="No recordings found"
          description={
            searchQuery
              ? `No results for "${searchQuery}"`
              : "Recordings will appear here after classes are recorded"
          }
          icon={<PlayCircle className="h-8 w-8 text-muted-foreground" />}
        />
      ) : viewMode === "grid" ? (
        <RecordingList
          recordings={filteredRecordings}
          loading={loading}
          watchBasePath={watchBasePath}
        />
      ) : (
        <div className="space-y-2">
          {filteredRecordings.map((recording) => (
            <button
              key={recording._id}
              type="button"
              onClick={() => navigate(`${watchBasePath}/${recording._id}`)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-primary/15 hover:shadow-md"
            >
              <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary transition group-hover:scale-105">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-slate-900 transition group-hover:text-primary">
                    {recording.classId?.title || "Class Recording"}
                  </h3>
                  <Badge
                    className={cn(
                      "shrink-0 rounded-full border-0 text-[9px] font-semibold",
                      recording.processingStatus === "ready"
                        ? "bg-emerald-100 text-emerald-800"
                        : recording.processingStatus === "processing"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {recording.processingStatus}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {recording.tutor?.name} • {recording.category?.name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {recording.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.round(recording.duration / 60)} mins
                </span>
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recordings;
