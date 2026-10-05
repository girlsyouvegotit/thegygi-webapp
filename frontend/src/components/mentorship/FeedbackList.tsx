import { Star, MessageSquare, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { mentorFeedback } from "@/types";

interface FeedbackListProps {
  feedback: mentorFeedback[];
}

const FeedbackList = ({ feedback }: FeedbackListProps) => {
  if (feedback.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-10 text-center text-muted-foreground">
        <MessageSquare className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm font-medium">No feedback yet</p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex flex-wrap gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <Star
            key={i}
            className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {feedback.map((fb) => (
        <Card key={fb._id} className="overflow-hidden">
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-medium text-slate-900">
                  {fb.projectTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(fb.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <Badge className="w-fit shrink-0 bg-green-100 text-green-700">
                <Award className="mr-1 h-3 w-3" /> {fb.overall}/10
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Technical</p>
                {renderStars(fb.technicalSkills)}
                <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
                  {fb.technicalSkills}/10
                </p>
              </div>
              {fb.uiUx !== undefined && (
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">UI/UX</p>
                  {renderStars(fb.uiUx)}
                  <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
                    {fb.uiUx}/10
                  </p>
                </div>
              )}
              {fb.problemSolving !== undefined && (
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Problem Solving</p>
                  {renderStars(fb.problemSolving)}
                  <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
                    {fb.problemSolving}/10
                  </p>
                </div>
              )}
              {fb.communication !== undefined && (
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Communication</p>
                  {renderStars(fb.communication)}
                  <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
                    {fb.communication}/10
                  </p>
                </div>
              )}
            </div>

            <p className="break-words text-sm text-muted-foreground">
              {fb.feedback}
            </p>

            {fb.recommendations.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium">Recommendations:</p>
                <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
                  {fb.recommendations.map((rec, index) => (
                    <li key={index} className="break-words">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeedbackList;
