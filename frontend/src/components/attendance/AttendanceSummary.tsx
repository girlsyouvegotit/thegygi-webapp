import { CheckCircle2, XCircle, Clock, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { attendanceSummary } from "@/types";

interface AttendanceSummaryProps {
  summary: attendanceSummary;
}

const AttendanceSummary = ({ summary }: AttendanceSummaryProps) => {
  const items = [
    {
      label: "Total",
      value: summary.total,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Present",
      value: summary.present,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Late",
      value: summary.late,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "Absent",
      value: summary.absent,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div
                className={`h-12 w-12 rounded-full ${item.bg} flex items-center justify-center mx-auto mb-3`}
              >
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <p className="text-2xl font-bold text-center">{item.value}</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {item.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Attendance Rate</span>
            </div>
            <span className="text-sm font-bold">{summary.percentage}%</span>
          </div>
          <Progress value={summary.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {summary.percentage >= 90
              ? "Excellent attendance!"
              : summary.percentage >= 75
                ? "Good attendance, keep it up!"
                : summary.percentage >= 50
                  ? "Attendance needs improvement"
                  : "Attendance is concerning, please attend classes regularly"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceSummary;
