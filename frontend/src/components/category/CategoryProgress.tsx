import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, FileQuestion, FileText, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryProgressProps {
  categoryName: string;
  progress: number;
  classesAttended: number;
  totalClasses: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  assignmentsDone: number;
  totalAssignments: number;
}

const CategoryProgress = ({
  categoryName,
  progress,
  classesAttended,
  totalClasses,
  quizzesCompleted,
  totalQuizzes,
  assignmentsDone,
  totalAssignments,
}: CategoryProgressProps) => {
  const getProgressColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressMessage = (value: number) => {
    if (value >= 80) return "Excellent progress!";
    if (value >= 60) return "Good progress, keep going!";
    if (value >= 40) return "Making progress, continue learning!";
    return "Just getting started!";
  };

  const metrics = [
    {
      icon: Video,
      label: "Classes",
      completed: classesAttended,
      total: totalClasses,
      color: "text-blue-500",
    },
    {
      icon: FileQuestion,
      label: "Quizzes",
      completed: quizzesCompleted,
      total: totalQuizzes,
      color: "text-green-500",
    },
    {
      icon: FileText,
      label: "Assignments",
      completed: assignmentsDone,
      total: totalAssignments,
      color: "text-orange-500",
    },
  ];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {categoryName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Award className="h-4 w-4" />
              Overall Progress
            </span>
            <span className={cn("font-bold", getProgressColor(progress))}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <p
            className={cn(
              "text-xs mt-2 font-medium",
              getProgressColor(progress),
            )}
          >
            {getProgressMessage(progress)}
          </p>
        </div>

        {/* Individual Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const percentage =
              metric.total > 0
                ? Math.round((metric.completed / metric.total) * 100)
                : 0;

            return (
              <div key={metric.label} className="text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <p className="text-xl font-bold">
                  {metric.completed}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{metric.total}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      metric.color,
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryProgress;
