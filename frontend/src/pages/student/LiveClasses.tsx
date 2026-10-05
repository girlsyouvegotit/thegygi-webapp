import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  Video,
  Calendar,
  Clock,
  Users,
  PlayCircle,
  Radio,
  ChevronRight,
  ArrowUpRight,
  Bell,
  BellOff,
  BellRing,
  Search,
  Zap,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { liveClass } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  areClassAlertsActive,
  disableClassAlerts,
  enableClassAlerts,
  scheduleClassReminders,
} from "@/lib/classAlerts";

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

const LiveClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<liveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "scheduled">("all");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertsBusy, setAlertsBusy] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/classes/upcoming");
      setClasses(data.data.classes as liveClass[]);
    } catch (error: unknown) {
      console.error("Failed to load classes:", error);
      toast.error(getErrorMessage(error, "Failed to load classes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    setAlertsEnabled(areClassAlertsActive());
  }, []);

  useEffect(() => {
    if (!alertsEnabled || classes.length === 0) return;
    scheduleClassReminders(classes);
  }, [alertsEnabled, classes]);

  const handleToggleAlerts = () => {
    if (alertsBusy) return;
    setAlertsBusy(true);
    try {
      if (alertsEnabled) {
        disableClassAlerts();
        setAlertsEnabled(false);
        toast.success("Class alerts turned off");
        return;
      }

      enableClassAlerts(classes);
      setAlertsEnabled(true);
      toast.success(
        "Alerts enabled — we'll remind you 15 minutes before class",
      );
    } finally {
      setAlertsBusy(false);
    }
  };

  const liveClasses = classes.filter((c) => c.status === "live");
  const scheduledClasses = classes.filter((c) => c.status === "scheduled");

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.tutor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "live" && cls.status === "live") ||
      (filter === "scheduled" && cls.status === "scheduled");

    return matchesSearch && matchesFilter;
  });

  const getDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

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
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Live Classes</h1>
            <p className="text-sm text-gray-500">
              Upcoming and live class sessions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveClasses.length > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs px-3 py-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
              {liveClasses.length} Live Now
            </Badge>
          )}
          <Badge className="bg-primary/10 text-primary text-xs px-3 py-1">
            {scheduledClasses.length} Scheduled
          </Badge>
        </div>
      </header>

      {/* ============================================ */}
      {/* FILTER & SEARCH BAR */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-[#E5E7EB] shadow-sm">
          {[
            { id: "all" as const, label: "All", count: classes.length },
            { id: "live" as const, label: "Live", count: liveClasses.length },
            {
              id: "scheduled" as const,
              label: "Scheduled",
              count: scheduledClasses.length,
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
            placeholder="Search classes, tutors, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-[#E5E7EB] rounded-full h-10"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* LIVE NOW BANNER */}
      {/* ============================================ */}
      {liveClasses.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 p-5 shadow-lg shadow-red-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-white animate-pulse" />
              <span className="text-white font-bold text-sm uppercase tracking-wider">
                Live Now
              </span>
            </div>
            <p className="text-white/90 text-xs mb-3">
              Join the ongoing session immediately
            </p>
            {liveClasses.slice(0, 1).map((cls) => (
              <button
                key={cls._id}
                onClick={() => navigate(`/live-class/${cls._id}`)}
                className="bg-white text-red-600 font-bold text-xs px-4 py-2 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Join {cls.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CLASSES GRID */}
      {/* ============================================ */}
      {filteredClasses.length === 0 ? (
        <EmptyState
          title="No classes found"
          description={
            searchQuery
              ? `No results for "${searchQuery}"`
              : "Check back later for upcoming classes"
          }
          icon={<Video className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const isLive = cls.status === "live";
            const classDate = new Date(cls.scheduledDate);
            const timeUntil = formatDistanceToNow(classDate, {
              addSuffix: true,
            });

            return (
              <button
                key={cls._id}
                onClick={() => navigate(`/live-class/${cls._id}`)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5",
                  isLive
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg shadow-red-500/10"
                    : "border-[#E5E7EB] bg-white shadow-sm hover:shadow-lg",
                )}
              >
                {/* Status Bar */}
                <div
                  className={cn(
                    "h-1 w-full",
                    isLive
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
                          isLive
                            ? "bg-red-500/10 text-red-500"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Video className="w-4 h-4" />
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          isLive
                            ? "bg-red-100 text-red-700 animate-pulse"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {isLive ? "Live" : "Scheduled"}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                    {cls.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                    {cls.description}
                  </p>

                  {/* Tutor Info */}
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={cls.tutor?.avatar}
                        alt={cls.tutor?.name}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {cls.tutor?.name?.charAt(0) || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {cls.tutor?.name || "Tutor"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {cls.category?.name}
                      </p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {getDateLabel(cls.scheduledDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(classDate, "h:mm a")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {cls.maxParticipants}
                    </span>
                  </div>

                  {/* Time Until */}
                  <p
                    className={cn(
                      "text-[10px] font-medium",
                      isLive ? "text-red-500" : "text-primary/60",
                    )}
                  >
                    {isLive ? "Happening now!" : timeUntil}
                  </p>

                  {/* Action Button */}
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    {isLive ? (
                      <span className="inline-flex items-center justify-center w-full py-2 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                        <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                        Join Now
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
      {classes.length > 0 && (
        <div
          className={cn(
            "rounded-2xl p-5 flex items-center justify-between gap-4 shadow-lg transition-colors",
            alertsEnabled
              ? "bg-emerald-950 text-white"
              : "bg-[#1C1C21] text-white",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                alertsEnabled ? "bg-emerald-500/20" : "bg-primary/20",
              )}
            >
              {alertsEnabled ? (
                <BellRing className="w-5 h-5 text-emerald-400" />
              ) : (
                <Zap className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">
                {alertsEnabled ? "Alerts are on" : "Never miss a class!"}
              </p>
              <p className="text-xs text-white/60">
                {alertsEnabled
                  ? "We'll remind you 15 minutes before each scheduled session"
                  : "Enable notifications to get reminders before sessions start"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleAlerts}
            disabled={alertsBusy}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-60",
              alertsEnabled
                ? "bg-white/10 text-white hover:bg-white/15 border border-white/15"
                : "bg-white text-gray-900 hover:bg-gray-100",
            )}
          >
            {alertsBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : alertsEnabled ? (
              <BellOff className="w-3.5 h-3.5" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
            {alertsBusy
              ? "Working…"
              : alertsEnabled
                ? "Disable Alerts"
                : "Enable Alerts"}
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveClasses;
