import { Users, Video, FileQuestion, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryAnalyticsProps {
  categoryName: string;
  totalStudents: number;
  totalClasses: number;
  totalQuizzes: number;
  totalAssignments: number;
  averageProgress: number;
}

const CategoryAnalytics = ({
  categoryName,
  totalStudents,
  totalClasses,
  totalQuizzes,
  totalAssignments,
  averageProgress,
}: CategoryAnalyticsProps) => {
  const stats = [
    { label: "Students", value: totalStudents, icon: Users },
    { label: "Classes", value: totalClasses, icon: Video },
    { label: "Quizzes", value: totalQuizzes, icon: FileQuestion },
    { label: "Assignments", value: totalAssignments, icon: FileText },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">{categoryName}</h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm">
            Average Progress: <strong>{averageProgress}%</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryAnalytics;