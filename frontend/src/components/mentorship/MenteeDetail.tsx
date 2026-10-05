import { Target, Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  user,
  mentorshipGoal,
  mentorshipSession,
  mentorFeedback,
} from "@/types";
import { mentorPageShell } from "@/lib/mentorPageStyles";

interface MenteeDetailProps {
  mentee: user;
  goals?: mentorshipGoal[];
  sessions?: mentorshipSession[];
  feedback?: mentorFeedback[];
  progress?: number;
  onScheduleSession?: () => void;
  onCreateGoal?: () => void;
  onAddFeedback?: () => void;
}

const MenteeDetail = ({
  mentee,
  goals = [],
  sessions = [],
  feedback = [],
  progress = 0,
  onScheduleSession,
  onCreateGoal,
  onAddFeedback,
}: MenteeDetailProps) => {
  return (
    <div className={mentorPageShell}>
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Avatar className="h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                <AvatarImage src={mentee.avatar} alt={mentee.name} />
                <AvatarFallback className="text-xl">
                  {mentee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold sm:text-2xl">
                  {mentee.name}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {mentee.email}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:ml-auto sm:flex sm:flex-wrap sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                onClick={onScheduleSession}
              >
                <Calendar className="mr-2 h-4 w-4" /> Schedule
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={onCreateGoal}
              >
                <Target className="mr-2 h-4 w-4" /> Goal
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={onAddFeedback}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Feedback
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Learning Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="goals" className="min-w-0">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="goals" className="flex-1 sm:flex-none">
            Goals ({goals.length})
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1 sm:flex-none">
            Sessions ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex-1 sm:flex-none">
            Feedback ({feedback.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-3 space-y-3">
          {goals.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No goals set yet
            </p>
          ) : (
            goals.map((goal) => (
              <Card key={goal._id} className="overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{goal.title}</p>
                      <p className="break-words text-sm text-muted-foreground">
                        {goal.description}
                      </p>
                    </div>
                    <Badge
                      className={
                        goal.status === "completed"
                          ? "w-fit bg-green-100 text-green-700"
                          : goal.status === "active"
                            ? "w-fit bg-blue-100 text-blue-700"
                            : "w-fit bg-gray-100 text-gray-700"
                      }
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  {goal.milestones.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {goal.milestones.map((milestone) => (
                        <div
                          key={milestone._id}
                          className="flex items-start gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            readOnly
                            className="mt-0.5 rounded"
                          />
                          <span
                            className={`break-words text-sm ${milestone.completed ? "text-muted-foreground line-through" : ""}`}
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

        <TabsContent value="sessions" className="mt-3 space-y-3">
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No sessions scheduled
            </p>
          ) : (
            sessions.map((session) => (
              <Card key={session._id} className="overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{session.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.scheduledDate).toLocaleString()} ·{" "}
                        {session.duration} mins
                      </p>
                    </div>
                    <Badge className="w-fit">{session.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="feedback" className="mt-3 space-y-3">
          {feedback.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No feedback provided yet
            </p>
          ) : (
            feedback.map((fb) => (
              <Card key={fb._id} className="overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <p className="break-words font-medium">{fb.projectTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span>Technical: {fb.technicalSkills}/10</span>
                    <span>Overall: {fb.overall}/10</span>
                  </div>
                  <p className="mt-2 break-words text-sm text-muted-foreground">
                    {fb.feedback}
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
