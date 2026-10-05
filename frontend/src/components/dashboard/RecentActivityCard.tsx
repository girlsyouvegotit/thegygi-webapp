import ActivityEventCard, {
  type ActivityEventItem,
} from "@/components/activities/ActivityEventCard";
import { Activity } from "lucide-react";

interface RecentActivityCardProps {
  activities: Array<{
    _id: string;
    action: string;
    createdAt: string;
    details?: string;
    user?: ActivityEventItem["user"];
    resourceType?: string;
  }>;
}

const RecentActivityCard = ({ activities }: RecentActivityCardProps) => {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-white">
          <Activity className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No recent activity
        </p>
      ) : (
        <div className="space-y-2.5">
          {activities.slice(0, 5).map((activity) => (
            <ActivityEventCard
              key={activity._id}
              log={activity}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivityCard;
