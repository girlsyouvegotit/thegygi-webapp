import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  GraduationCap,
  HeartHandshake,
  FolderTree,
  Video,
  PlayCircle,
  TrendingUp,
  Activity,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import type { adminOverview, ActivityLog } from "@/types";
import ActivityEventCard from "@/components/activities/ActivityEventCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<adminOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, activityRes] = await Promise.all([
          api.get("/analytics/admin/overview"),
          api.get("/activities?limit=5"),
        ]);
        setOverview(overviewRes.data.data.overview);
        setRecentActivity(activityRes.data.data.logs);
      } catch (error: any) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "Students",
      value: overview?.totalStudents || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Tutors",
      value: overview?.totalTutors || 0,
      icon: GraduationCap,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Mentors",
      value: overview?.totalMentors || 0,
      icon: HeartHandshake,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Categories",
      value: overview?.totalCategories || 0,
      icon: FolderTree,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Live Classes",
      value: overview?.liveClasses || 0,
      icon: Video,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Recordings",
      value: overview?.totalRecordings || 0,
      icon: PlayCircle,
      color: "text-pink-500",
      bg: "bg-pink-50",
    },
  ];

  const quickActions = [
    { label: "Manage Categories", url: "/admin/categories", icon: FolderTree },
    { label: "Manage Users", url: "/admin/users", icon: Users },
    { label: "Mentorship", url: "/admin/mentorship", icon: HeartHandshake },
    { label: "Recordings", url: "/admin/recordings", icon: PlayCircle },
    { label: "Analytics", url: "/admin/analytics", icon: TrendingUp },
    { label: "Finance", url: "/admin/finance", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <div
                className={`h-10 w-10 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-2`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.url}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={() => navigate(action.url)}
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="rounded-[1.5rem] border-slate-200/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Activity className="h-5 w-5 text-teal-800" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No recent activity
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentActivity.map((log) => (
                <ActivityEventCard key={log._id} log={log} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
