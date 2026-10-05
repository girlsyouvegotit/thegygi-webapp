import {
  Activity,
  Users,
  Video,
  PlayCircle,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EngagementMetricsProps {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  liveClasses: number;
  recordingsWatched: number;
  communityMessages: number;
}

const EngagementMetrics = ({
  dailyActiveUsers,
  weeklyActiveUsers,
  liveClasses,
  recordingsWatched,
  communityMessages,
}: EngagementMetricsProps) => {
  const metrics = [
    { label: "Daily Active Users", value: dailyActiveUsers, icon: Users },
    { label: "Weekly Active Users", value: weeklyActiveUsers, icon: Activity },
    { label: "Live Classes", value: liveClasses, icon: Video },
    { label: "Recordings Watched", value: recordingsWatched, icon: PlayCircle },
    {
      label: "Community Messages",
      value: communityMessages,
      icon: MessageSquare,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Engagement Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <metric.icon className="h-4 w-4 text-primary" />
                <span className="text-sm">{metric.label}</span>
              </div>
              <span className="font-bold">{metric.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EngagementMetrics;
