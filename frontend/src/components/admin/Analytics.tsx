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
  Loader2,
} from "lucide-react";
import { Card, CardContent} from "@/components/ui/card";
import type { adminOverview } from "@/types";

const Analytics = () => {
  const [overview, setOverview] = useState<adminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const { data } = await api.get("/analytics/admin/overview");
        setOverview(data.data.overview);
      } catch (error) {
        toast.error("Failed to load analytics");
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
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
      label: "Admins",
      value: overview?.totalAdmins || 0,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50",
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
    {
      label: "Active Mentorships",
      value: overview?.activeMentorships || 0,
      icon: HeartHandshake,
      color: "text-teal-500",
      bg: "bg-teal-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <p className="text-muted-foreground">
          Overview of platform-wide metrics
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <div
                className={`h-12 w-12 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-3`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Analytics;
