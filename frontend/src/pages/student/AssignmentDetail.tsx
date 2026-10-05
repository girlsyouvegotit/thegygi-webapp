import { useNavigate, useParams } from "react-router";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { SimpleSectionSkeleton } from "@/components/loading/PageSkeleton";
import {
  ChevronLeft,
  Calendar,
  FileText,
  Target,
    Award,
} from "lucide-react";
import { useAssignment } from "@/hooks/useAssignment";
import AssignmentSubmission from "@/components/assignments/AssignmentSubmission";
import AssignmentFeedback from "@/components/assignments/AssignmentFeedback";
import SubmissionViewer from "@/components/assignments/SubmissionViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AssignmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    assignment,
    submission,
    loading,
    fetchMySubmission,
  } = useAssignment(id);

  if (loading) {
    return <SimpleSectionSkeleton />;
  }

  if (!assignment) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h1 className="text-lg font-bold text-slate-900">Assignment not found</h1>
        <Button
          className="mt-4 rounded-full"
          variant="outline"
          onClick={() => navigate("/assignments")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to assignments
        </Button>
      </div>
    );
  }

  const overdue = isPast(new Date(assignment.dueDate));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-8">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 h-10 w-10 rounded-full"
          onClick={() => navigate("/assignments")}
          aria-label="Back to assignments"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                overdue
                  ? "bg-rose-500/10 text-rose-700"
                  : "bg-emerald-500/10 text-emerald-700"
              }
            >
              {overdue ? "Past due" : "Active"}
            </Badge>
            {assignment.category?.name && (
              <span className="text-xs font-medium text-slate-500">
                {assignment.category.name}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {assignment.title}
          </h1>
          {assignment.description ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {assignment.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <Calendar className="mb-2 h-4 w-4 text-primary" />
          <p className="text-sm font-black text-slate-900">
            {format(new Date(assignment.dueDate), "MMM d, yyyy")}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Due {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <Target className="mb-2 h-4 w-4 text-primary" />
          <p className="text-sm font-black text-slate-900">{assignment.maxScore}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Max score
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:col-span-1">
          <Award className="mb-2 h-4 w-4 text-primary" />
          <p className="text-sm font-black text-slate-900">
            {assignment.tutor?.name || "Tutor"}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Assigned by
          </p>
        </div>
      </div>

      {submission ? (
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Your submission</h2>
            <p className="mt-1 text-xs text-slate-500">
              Submitted{" "}
              {format(new Date(submission.submittedAt), "MMM d, yyyy · h:mm a")}
              {" · "}
              {submission.submissionType === "github_url"
                ? "Link"
                : submission.submissionType === "file"
                  ? "File"
                  : "Text"}
            </p>

            {submission.submissionType === "github_url" ? (
              <div className="mt-3">
                <SubmissionViewer url={submission.content} mode="link" />
              </div>
            ) : submission.submissionType === "file" ? (
              <ul className="mt-3 space-y-2">
                {(submission.attachments?.length
                  ? submission.attachments
                  : []
                ).map((url) => (
                  <li key={url}>
                    <SubmissionViewer url={url} mode="file" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {submission.content}
              </div>
            )}
          </div>
          <AssignmentFeedback submission={submission} />
          <Button
            variant="outline"
            className="h-11 w-full rounded-full"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Back to dashboard
          </Button>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Submit work</h2>
            <p className="text-xs text-slate-500">
              Choose a submission type and send your work
            </p>
          </div>
          <div className="px-5 py-5">
            <AssignmentSubmission
              assignment={assignment}
              onSubmitted={() => {
                void fetchMySubmission();
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default AssignmentDetail;
