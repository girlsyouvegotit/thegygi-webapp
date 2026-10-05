import { FileText, Calendar, Award, Loader2, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { assignment } from "@/types";
import { useNavigate } from "react-router";
import EmptyState from "@/components/global/EmptyState";

interface AssignmentListProps {
  assignments: assignment[];
  loading?: boolean;
  isTutor?: boolean;
}

const AssignmentList = ({
  assignments,
  loading,
  isTutor,
}: AssignmentListProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments"
        description={
          isTutor
            ? "Create your first assignment to get started"
            : "No assignments available in your categories yet"
        }
        icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        actionLabel={isTutor ? "Create Assignment" : undefined}
        onAction={
          isTutor ? () => navigate("/tutor/assignments/new") : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assignments.map((assignment) => {
        const isOverdue = new Date(assignment.dueDate) < new Date();
        const isDueSoon =
          !isOverdue &&
          new Date(assignment.dueDate).getTime() - new Date().getTime() <
            3 * 24 * 60 * 60 * 1000;

        return (
          <Card
            key={assignment._id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() =>
              navigate(
                isTutor
                  ? `/tutor/assignments/${assignment._id}`
                  : `/assignments/${assignment._id}`,
              )
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge
                  className={
                    isOverdue
                      ? "bg-red-100 text-red-700"
                      : isDueSoon
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  }
                >
                  {isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "Active"}
                </Badge>
                {assignment.category && (
                  <span className="text-xs text-muted-foreground">
                    {assignment.category.name}
                  </span>
                )}
              </div>
              <CardTitle className="text-base mt-2">
                {assignment.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {assignment.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {format(new Date(assignment.dueDate), "h:mm a")}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-3 w-3 shrink-0" />
                Max Score: {assignment.maxScore}
              </div>
              {assignment.tutor && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3 shrink-0" />
                  {assignment.tutor.name}
                </div>
              )}

              <Button
                className="w-full mt-2"
                variant={isTutor ? "outline" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    isTutor
                      ? `/tutor/assignments/${assignment._id}/submissions`
                      : `/assignments/${assignment._id}`,
                  );
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isTutor ? "View Submissions" : "View Assignment"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AssignmentList;
