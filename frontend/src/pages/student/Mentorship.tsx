import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { useMentorship } from "@/hooks/useMentorship";
import { HeartHandshake} from "lucide-react";
import MentorCard from "@/components/mentorship/MentorCard";
import GoalTimeline from "@/components/mentorship/GoalTimeline";
import SessionList from "@/components/mentorship/SessionList";
import FeedbackList from "@/components/mentorship/FeedbackList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/global/EmptyState";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";

const Mentorship = () => {
  const { user } = useAuth();
  const { myMentor, goals, sessions, feedback, loading, fetchGoals } =
    useMentorship();

  useEffect(() => {
    if (user?._id) {
      fetchGoals(user._id);
    }
  }, [user]);

  if (loading) {
    return <PageListSkeleton />;
  }

  if (!myMentor) {
    return (
      <EmptyState
        title="No Mentor Assigned"
        description="A mentor will be assigned to you soon"
        icon={<HeartHandshake className="h-12 w-12 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mentorship</h1>
        <p className="text-muted-foreground mt-1">Your mentorship journey</p>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-slate-700">
        After you complete a program, mentorship continues with alumni career
        check-ins. Explore jobs and portfolio reviews in{" "}
        <a
          href="/after-graduation"
          className="font-bold text-primary hover:underline"
        >
          After Graduation
        </a>
        .
      </div>

      <MentorCard
        mentor={myMentor}
        activeGoals={goals.filter((g) => g.status === "active").length}
        completedGoals={goals.filter((g) => g.status === "completed").length}
      />

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="goals">
          <GoalTimeline goals={goals} />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionList sessions={sessions} />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackList feedback={feedback} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Mentorship;
