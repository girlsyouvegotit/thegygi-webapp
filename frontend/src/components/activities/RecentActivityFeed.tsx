import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import ActivityEventCard, {
  type ActivityEventItem,
} from "@/components/activities/ActivityEventCard";
import { cn } from "@/lib/utils";

interface RecentActivityFeedProps {
  /** Where “View all” should go */
  viewAllHref?: string;
  limit?: number;
  className?: string;
  title?: string;
  subtitle?: string;
}

const RecentActivityFeed = ({
  viewAllHref,
  limit = 5,
  className,
  title = "Latest activity",
  subtitle = "Recent platform events",
}: RecentActivityFeedProps) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/activities?page=1&limit=${limit}`);
        if (!cancelled) {
          setLogs(
            (data.data?.logs || data.logs || []) as ActivityEventItem[],
          );
        }
      } catch {
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <section
      className={cn(
        "min-w-0 rounded-[1.5rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-white">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        {viewAllHref && (
          <button
            type="button"
            onClick={() => navigate(viewAllHref)}
            className="text-[11px] font-semibold text-teal-800 hover:underline"
          >
            View all
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F7F8F9] px-4 py-8 text-center">
          <Activity className="mx-auto mb-2 h-5 w-5 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => (
            <div key={log._id} className="relative">
              <ActivityEventCard log={log} compact />
              <p className="mt-1 px-1 text-[10px] font-medium text-slate-400">
                {formatDistanceToNow(new Date(log.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentActivityFeed;
