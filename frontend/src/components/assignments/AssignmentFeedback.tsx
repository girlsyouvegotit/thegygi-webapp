import { CheckCircle2, MessageSquare, Award, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { assignmentSubmission } from "@/types";

interface AssignmentFeedbackProps {
  submission: assignmentSubmission;
}

const AssignmentFeedback = ({ submission }: AssignmentFeedbackProps) => {
  if (submission.status !== "graded") {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Assignment not graded yet</p>
          <p className="text-sm mt-1">
            Your submission is {submission.status}. Check back later for
            feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Assignment Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Award className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{submission.score}</p>
            <p className="text-xs text-muted-foreground">Your Score</p>
          </div>
          <Badge className="ml-auto bg-green-100 text-green-700">
            Graded by {submission.gradedBy?.name || "Tutor"}
          </Badge>
        </div>

        {submission.feedback && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Feedback</h4>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {submission.feedback}
            </p>
          </div>
        )}

        {submission.gradedAt && (
          <p className="text-xs text-muted-foreground">
            Graded on {new Date(submission.gradedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentFeedback;
