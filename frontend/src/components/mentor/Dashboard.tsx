import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import type { mentorAnalytics, mentorshipSession } from "@/types";
import EmptyState from "@/components/global/EmptyState";

// Define proper types
interface Goal {
  _id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "abandoned";
  targetDate: Date;
  mentee?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  milestones?: Array<{
    _id: string;
    title: string;
    completed: boolean;
  }>;
}

type SessionWithMentee = Omit<mentorshipSession, "mentee"> & {
  mentee?: {
    _id: string;
    name: string;
    avatar?: string;
  };
};

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<mentorAnalytics | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionWithMentee[]>(
    [],
  );
  const [recentGoals, setRecentGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const [analyticsRes, sessionsRes, goalsRes] = await Promise.all([
        api.get(`/analytics/mentor/${user._id}`),
        api.get("/mentorship/sessions/my"),
        api.get("/mentorship/goals"),
      ]);

      setAnalytics(analyticsRes.data.data.analytics as mentorAnalytics);
      setUpcomingSessions(
        (sessionsRes.data.data.sessions as SessionWithMentee[]).filter(
          (s) => s.status === "scheduled" || s.status === "confirmed",
        ),
      );
      setRecentGoals((goalsRes.data.data.goals as Goal[])?.slice(0, 5) || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Failed to load dashboard:", error);
      toast.error(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "My Mentees",
      value: analytics?.totalMentees || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Active Goals",
      value: analytics?.activeGoals || 0,
      icon: Target,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Total Sessions",
      value: analytics?.totalSessions || 0,
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Goals Completed",
      value: analytics?.completedGoals || 0,
      icon: CheckCircle2,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        <Button onClick={() => navigate("/mentor/sessions/new")}>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div
                className={`h-12 w-12 rounded-full ${stat.bg} flex items-center justify-center mx-auto mb-3`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-center">{stat.value}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming Sessions
            </CardTitle>
            <CardDescription>
              Your scheduled mentorship sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <EmptyState
                title="No upcoming sessions"
                description="Schedule a session with your mentees"
                icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
              />
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/mentor/sessions/${session._id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session.mentee?.avatar}
                          alt={session.mentee?.name}
                        />
                        <AvatarFallback>
                          {session.mentee?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{session.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.mentee?.name} •{" "}
                          {format(
                            new Date(session.scheduledDate),
                            "MMM d, h:mm a",
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{session.duration} mins</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recent Goals
            </CardTitle>
            <CardDescription>Latest goals for your mentees</CardDescription>
          </CardHeader>
          <CardContent>
            {recentGoals.length === 0 ? (
              <EmptyState
                title="No goals yet"
                description="Create goals for your mentees to track progress"
                icon={<Target className="h-8 w-8 text-muted-foreground" />}
              />
            ) : (
              <div className="space-y-3">
                {recentGoals.map((goal) => (
                  <div
                    key={goal._id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/mentor/goals`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{goal.title}</p>
                      <Badge
                        className={
                          goal.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : goal.status === "active"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {goal.mentee?.name}
                    </p>
                    <Progress
                      value={
                        goal.milestones && goal.milestones.length > 0
                          ? (goal.milestones.filter((m) => m.completed).length /
                              goal.milestones.length) *
                            100
                          : 0
                      }
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "My Mentees", icon: Users, url: "/mentor/mentees" },
          { label: "Sessions", icon: Calendar, url: "/mentor/sessions" },
          { label: "Goals", icon: Target, url: "/mentor/goals" },
          { label: "Analytics", icon: TrendingUp, url: "/mentor/analytics" },
        ].map((action) => (
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
    </div>
  );
};

export default MentorDashboard;
