import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Target,
  Calendar,
  MessageSquare,
  Star,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import type { user } from "@/types";
import EmptyState from "@/components/global/EmptyState";

// Define proper types
interface Milestone {
  _id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "abandoned";
  milestones?: Milestone[];
}

interface Session {
  _id: string;
  topic: string;
  scheduledDate: Date;
  status: string;
  duration: number;
}

interface FeedbackItem {
  _id: string;
  projectTitle: string;
  overall: number;
  feedback: string;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
}

const MenteeDetail = () => {
  const { menteeId } = useParams<{ menteeId: string }>();
  const navigate = useNavigate();
  const [mentee, setMentee] = useState<user | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenteeData = useCallback(async () => {
    if (!menteeId) return;

    setLoading(true);
    try {
      const [menteeRes, goalsRes, sessionsRes, feedbackRes] = await Promise.all(
        [
          api.get(`/users/${menteeId}`),
          api.get(`/mentorship/goals/mentee/${menteeId}`),
          api.get("/mentorship/sessions/my"),
          api.get(`/mentorship/feedback/mentee/${menteeId}`),
        ],
      );

      setMentee(menteeRes.data.data.user as user);
      setGoals((goalsRes.data.data.goals as Goal[]) || []);
      setSessions(
        (sessionsRes.data.data.sessions as Session[]).filter(
          (s) =>
            (s as Session & { mentee?: { _id: string } }).mentee?._id ===
            menteeId,
        ),
      );
      setFeedback((feedbackRes.data.data.feedback as FeedbackItem[]) || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Failed to load mentee data:", error);
      toast.error(err.response?.data?.message || "Failed to load mentee data");
    } finally {
      setLoading(false);
    }
  }, [menteeId]);

  useEffect(() => {
    fetchMenteeData();
  }, [fetchMenteeData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mentee) {
    return (
      <EmptyState
        title="Mentee not found"
        description="The mentee you're looking for doesn't exist"
        icon={<User className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }

  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const goalProgress =
    goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/mentor/mentees")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Mentees
      </Button>

      {/* Mentee Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={mentee.avatar} alt={mentee.name} />
              <AvatarFallback className="text-xl">
                {mentee.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{mentee.name}</h2>
              <p className="text-muted-foreground">{mentee.email}</p>
              {mentee.categories && mentee.categories.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {(mentee.categories as Category[]).map((cat) => (
                    <Badge key={cat._id} variant="outline">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() =>
                navigate(`/mentor/sessions/new?menteeId=${mentee._id}`)
              }
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Goal Progress</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {completedGoals} of {goals.length} goals completed
            </span>
            <span className="text-sm font-bold">
              {Math.round(goalProgress)}%
            </span>
          </div>
          <Progress value={goalProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">
            <Target className="h-4 w-4 mr-2" />
            Goals ({goals.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Calendar className="h-4 w-4 mr-2" />
            Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <Star className="h-4 w-4 mr-2" />
            Feedback ({feedback.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-3 mt-4">
          {goals.length === 0 ? (
            <EmptyState
              title="No goals yet"
              description="Create goals for this mentee"
              icon={<Target className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            goals.map((goal) => (
              <Card key={goal._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{goal.title}</p>
                    <Badge
                      className={
                        goal.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {goal.description}
                  </p>
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="space-y-1">
                      {goal.milestones.map((milestone) => (
                        <div
                          key={milestone._id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              milestone.completed
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            }`}
                          >
                            {milestone.completed && (
                              <MessageSquare className="w-2 h-2 text-white" />
                            )}
                          </div>
                          <span
                            className={
                              milestone.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-3 mt-4">
          {sessions.length === 0 ? (
            <EmptyState
              title="No sessions yet"
              description="Schedule a session with this mentee"
              icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            sessions.map((session) => (
              <Card key={session._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{session.topic}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(session.scheduledDate),
                          "MMM d, yyyy h:mm a",
                        )}
                      </p>
                    </div>
                    <Badge
                      className={
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : session.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-3 mt-4">
          {feedback.length === 0 ? (
            <EmptyState
              title="No feedback yet"
              description="Provide feedback to this mentee"
              icon={<Star className="h-8 w-8 text-muted-foreground" />}
            />
          ) : (
            feedback.map((item) => (
              <Card key={item._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium">{item.projectTitle}</p>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {item.overall}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.feedback}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MenteeDetail;
