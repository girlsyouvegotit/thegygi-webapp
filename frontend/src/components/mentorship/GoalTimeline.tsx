import { CheckCircle2, Circle, Target, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import type { mentorshipGoal } from "@/types";

interface GoalTimelineProps {
  goals: mentorshipGoal[];
}

const GoalTimeline = ({ goals }: GoalTimelineProps) => {
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-10 text-center text-muted-foreground">
        <Target className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm font-medium">No goals set yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {goals.map((goal) => {
        const completedMilestones = goal.milestones.filter(
          (m) => m.completed,
        ).length;
        const progress =
          goal.milestones.length > 0
            ? (completedMilestones / goal.milestones.length) * 100
            : goal.status === "completed"
              ? 100
              : 0;

        return (
          <Card key={goal._id} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <h4 className="min-w-0 break-words font-medium text-slate-900">
                    {goal.title}
                  </h4>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground sm:pt-0.5">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(goal.targetDate), "MMM d, yyyy")}
                </span>
              </div>

              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-1">
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone._id}
                    className="flex items-start gap-3 py-1"
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span
                      className={`min-w-0 break-words text-sm ${milestone.completed ? "text-muted-foreground line-through" : ""}`}
                    >
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GoalTimeline;
