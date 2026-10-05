import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { format, isPast } from "date-fns";
import {
  ChevronLeft,
  Calendar,
  FileText,
  Target,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { assignment, assignmentSubmission } from "@/types";

const AssignmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<assignment | null>(null);
  const [submissions, setSubmissions] = useState<assignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [assignmentRes, submissionsRes] = await Promise.all([
          api.get(`/assignments/${id}`),
          api.get(`/assignments/${id}/submissions`).catch(() => null),
        ]);
        if (cancelled) return;
        setItem(assignmentRes.data.data.assignment as assignment);
        setSubmissions(
          (submissionsRes?.data?.data?.submissions as assignmentSubmission[]) ||
            [],
        );
      } catch {
        if (!cancelled) setItem(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h1 className="text-lg font-bold text-slate-900">Assignment not found</h1>
        <Button
          className="mt-4 rounded-full"
          variant="outline"
          onClick={() => navigate("/tutor/assignments")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to assignments
        </Button>
      </div>
    );
  }

  const overdue = isPast(new Date(item.dueDate));
  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-8">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 h-10 w-10 rounded-full"
          onClick={() => navigate("/tutor/assignments")}
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
            {item.category?.name && (
              <span className="text-xs font-medium text-slate-500">
                {item.category.name}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {item.title}
          </h1>
          {item.description ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {item.description}
            </p>
          ) : null}
        </div>
        <Button
          className="hidden h-10 shrink-0 rounded-full sm:inline-flex"
          onClick={() => navigate(`/tutor/assignments/${item._id}/grade`)}
        >
          Grade submissions
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          {
            icon: Calendar,
            label: "Due date",
            value: format(new Date(item.dueDate), "MMM d, yyyy"),
          },
          {
            icon: Target,
            label: "Max score",
            value: item.maxScore,
          },
          {
            icon: ClipboardList,
            label: "Submissions",
            value: submissions.length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <stat.icon className="mb-2 h-4 w-4 text-primary" />
            <p className="text-lg font-black text-slate-900">{stat.value}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {item.submissionTypes?.length ? (
        <div className="flex flex-wrap gap-2">
          {item.submissionTypes.map((type) => (
            <span
              key={type}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {type === "github_url"
                ? "GitHub URL"
                : type === "file"
                  ? "File upload"
                  : "Text"}
            </span>
          ))}
        </div>
      ) : null}

      <Button
        className="h-11 w-full rounded-full sm:hidden"
        onClick={() => navigate(`/tutor/assignments/${item._id}/grade`)}
      >
        Grade submissions
      </Button>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Submissions</h2>
            <p className="text-xs text-slate-500">
              {submissions.length} total · {gradedCount} graded
            </p>
          </div>
        </div>
        {submissions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No student submissions yet
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {submissions.map((sub) => (
              <li
                key={sub._id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {typeof sub.student === "object" && sub.student
                      ? sub.student.name
                      : "Student"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(sub.submittedAt), "MMM d, h:mm a")} ·{" "}
                    {sub.submissionType.replace("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {sub.score != null ? (
                    <span className="text-sm font-bold text-slate-900">
                      {sub.score}/{item.maxScore}
                    </span>
                  ) : null}
                  <Badge
                    className={
                      sub.status === "graded"
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-amber-500/10 text-amber-800"
                    }
                  >
                    {sub.status === "graded" ? "Graded" : "Pending"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AssignmentDetail;
