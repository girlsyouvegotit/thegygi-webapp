import { CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { attendance } from "@/types";

interface AttendanceTableProps {
  attendance: attendance[];
  showPercentage?: boolean;
}

const AttendanceTable = ({
  attendance,
  showPercentage = true,
}: AttendanceTableProps) => {
  if (attendance.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No attendance records</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Present
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" /> Late
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" /> Absent
          </Badge>
        );
      case "excused":
        return <Badge variant="outline">Excused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          {showPercentage && <TableHead>Attendance %</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendance.map((record) => (
          <TableRow key={record._id}>
            <TableCell className="font-medium">
              {record.student?.name || "Student"}
            </TableCell>
            <TableCell>
              {new Date(record.joinedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>{getStatusBadge(record.status)}</TableCell>
            {showPercentage && (
              <TableCell>{record.attendancePercentage}%</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AttendanceTable;
