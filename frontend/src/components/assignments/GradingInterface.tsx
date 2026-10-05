import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Link2,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import SubmissionViewer from "@/components/assignments/SubmissionViewer";
import type { assignmentSubmission } from "@/types";

const gradingSchema = z.object({
  score: z.coerce.number().min(0, "Score cannot be negative"),
  feedback: z.string().optional(),
});

type FormValues = z.infer<typeof gradingSchema>;

interface GradingInterfaceProps {
  submission: assignmentSubmission;
  maxScore?: number;
  onGraded?: () => void;
  onCancel?: () => void;
}

const pillInput =
  "h-12 rounded-full border-slate-200 bg-slate-50 px-5 text-base shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:h-11 sm:text-sm";

const pillTextarea =
  "min-h-28 resize-y rounded-3xl border-slate-200 bg-slate-50 px-5 py-3.5 text-base leading-relaxed shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:min-h-24 sm:text-sm";

const GradingInterface = ({
  submission,
  maxScore,
  onGraded,
  onCancel,
}: GradingInterfaceProps) => {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(gradingSchema) as Resolver<FormValues>,
    defaultValues: {
      score: submission.score ?? 0,
      feedback: submission.feedback || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (maxScore != null && values.score > maxScore) {
      form.setError("score", {
        message: `Score cannot exceed ${maxScore}`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(
        `/assignments/submissions/${submission._id}/grade`,
        values,
      );
      toast.success("Submission graded");
      onGraded?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to grade submission");
    } finally {
      setSubmitting(false);
    }
  };

  const studentName =
    typeof submission.student === "object" && submission.student
      ? submission.student.name
      : "Student";

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      style={{ fontSize: "16px" }}
    >
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Student work
            </p>
            <p className="text-sm font-bold text-slate-900">{studentName}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
            {submission.submissionType === "github_url" ? (
              <Link2 className="h-3 w-3" />
            ) : submission.submissionType === "file" ? (
              <Upload className="h-3 w-3" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            {submission.submissionType === "github_url"
              ? "Link"
              : submission.submissionType === "file"
                ? "File"
                : "Text"}
          </span>
        </div>

        {submission.submissionType === "github_url" ? (
          <SubmissionViewer url={submission.content} mode="link" />
        ) : submission.submissionType === "file" ? (
          <ul className="space-y-2">
            {(submission.attachments?.length
              ? submission.attachments
              : []
            ).map((url) => (
              <li key={url}>
                <SubmissionViewer url={url} mode="file" />
              </li>
            ))}
            {!submission.attachments?.length && submission.content ? (
              <p className="text-sm text-slate-600">{submission.content}</p>
            ) : null}
          </ul>
        ) : (
          <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200 sm:max-h-72">
            {submission.content}
          </div>
        )}
      </div>

      <FieldGroup className="space-y-4">
        <Controller
          name="score"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel>
                Score{maxScore != null ? ` (max ${maxScore})` : ""}
              </FieldLabel>
              <Input
                type="number"
                min={0}
                max={maxScore}
                className={pillInput}
                {...field}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="feedback"
          control={form.control}
          render={({ field }) => (
            <Field className="gap-2">
              <FieldLabel>Feedback</FieldLabel>
              <Textarea
                rows={4}
                placeholder="Share constructive feedback with the student…"
                className={pillTextarea}
                {...field}
              />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 rounded-full text-base sm:h-11 sm:text-sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-12 flex-[1.4] rounded-full text-base shadow-md shadow-primary/20 sm:h-11 sm:text-sm"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Submit Grade"
          )}
        </Button>
      </div>
    </form>
  );
};

export default GradingInterface;
