import {
  CheckCircle2,
  FileText,
  User,
  Link2,
  Upload,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { assignmentSubmission } from "@/types";
import { cn } from "@/lib/utils";

interface SubmissionListProps {
  submissions: assignmentSubmission[];
  selectedId?: string | null;
  maxScore?: number;
  onGrade?: (submission: assignmentSubmission) => void;
}

const typeLabel = (type: assignmentSubmission["submissionType"]) => {
  if (type === "github_url") return "Link";
  if (type === "file") return "File";
  return "Text";
};

const typeIcon = (type: assignmentSubmission["submissionType"]) => {
  if (type === "github_url") return Link2;
  if (type === "file") return Upload;
  return FileText;
};

const SubmissionList = ({
  submissions,
  selectedId,
  maxScore,
  onGrade,
}: SubmissionListProps) => {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-14 text-center">
        <FileText className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">No submissions yet</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Student work will show up here once they submit.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {submissions.map((submission) => {
        const TypeIcon = typeIcon(submission.submissionType);
        const selected = selectedId === submission._id;
        const studentName =
          typeof submission.student === "object" && submission.student
            ? submission.student.name
            : "Student";
        const studentEmail =
          typeof submission.student === "object" && submission.student
            ? submission.student.email
            : "";

        return (
          <li key={submission._id}>
            <article
              className={cn(
                "rounded-2xl border bg-white p-3.5 shadow-sm transition sm:p-4",
                selected
                  ? "border-primary/40 ring-2 ring-primary/15"
                  : "border-slate-200/80 hover:border-primary/25",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:h-11 sm:w-11">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {studentName}
                      </p>
                      {studentEmail ? (
                        <p className="truncate text-xs text-slate-500">
                          {studentEmail}
                        </p>
                      ) : null}
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        submission.status === "graded"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : submission.status === "returned"
                            ? "bg-sky-500/10 text-sky-700"
                            : "bg-amber-500/10 text-amber-800",
                      )}
                    >
                      {submission.status === "graded"
                        ? "Graded"
                        : submission.status === "returned"
                          ? "Returned"
                          : "Pending"}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <TypeIcon className="h-3 w-3" />
                      {typeLabel(submission.submissionType)}
                    </span>
                    <span>
                      {format(
                        new Date(submission.submittedAt),
                        "MMM d · h:mm a",
                      )}
                    </span>
                    {submission.status === "graded" &&
                    submission.score != null ? (
                      <span className="font-semibold text-slate-700">
                        {submission.score}
                        {maxScore != null ? `/${maxScore}` : ""} pts
                      </span>
                    ) : null}
                  </div>

                  {submission.status === "graded" && submission.feedback ? (
                    <p className="mt-2 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {submission.feedback}
                    </p>
                  ) : null}

                  {onGrade && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          submission.status === "graded" ? "outline" : "default"
                        }
                        className="h-9 w-full rounded-full sm:w-auto"
                        onClick={() => onGrade(submission)}
                      >
                        {submission.status === "graded" ? (
                          <>
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Review grade
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Grade
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
};

export default SubmissionList;
