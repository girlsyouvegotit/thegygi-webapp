import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, CheckCircle2, XCircle } from "lucide-react";

interface QuizProgressProps {
  totalQuizzes: number;
  completedQuizzes: number;
  passedQuizzes: number;
  averageScore: number;
}

const QuizProgress = ({
  totalQuizzes,
  completedQuizzes,
  passedQuizzes,
  averageScore,
}: QuizProgressProps) => {
  const completionRate =
    totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileQuestion className="h-4 w-4 text-primary" />
          Quiz Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">
              {completedQuizzes}/{totalQuizzes}
            </span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{passedQuizzes}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </div>
          <div>
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold">
              {completedQuizzes - passedQuizzes}
            </p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold">{averageScore}%</p>
          <p className="text-xs text-muted-foreground">Average Score</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizProgress;
