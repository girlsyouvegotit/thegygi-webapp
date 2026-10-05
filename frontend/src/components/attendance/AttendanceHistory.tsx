import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { attendance } from "@/types";

interface AttendanceHistoryProps {
  attendance: attendance[];
}

const AttendanceHistory = ({ attendance }: AttendanceHistoryProps) => {
  if (attendance.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <CalendarDays className="h-8 w-8 mx-auto mb-2" />
          <p>No attendance history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attendance.map((record) => (
            <div
              key={record._id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">
                  {record.classId?.title || "Class"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(record.joinedAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <span
                className={`text-sm font-medium ${
                  record.status === "present"
                    ? "text-green-600"
                    : record.status === "late"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceHistory;
