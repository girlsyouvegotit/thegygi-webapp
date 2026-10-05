import { Target, Calendar, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface MentorshipProgressProps {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalSessions: number;
  completedSessions: number;
}

const MentorshipProgress = ({
  totalGoals,
  completedGoals,
  activeGoals,
  totalSessions,
  completedSessions,
}: MentorshipProgressProps) => {
  const goalProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  const sessionProgress =
    totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-primary" />
          Mentorship Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" /> Goals
            </span>
            <span>
              {completedGoals}/{totalGoals}
            </span>
          </div>
          <Progress value={goalProgress} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Sessions
            </span>
            <span>
              {completedSessions}/{totalSessions}
            </span>
          </div>
          <Progress value={sessionProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-center pt-2">
          <div className="p-3 bg-muted rounded">
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{activeGoals}</p>
            <p className="text-xs text-muted-foreground">Active Goals</p>
          </div>
          <div className="p-3 bg-muted rounded">
            <CheckCircle2 className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{completedGoals}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorshipProgress;
