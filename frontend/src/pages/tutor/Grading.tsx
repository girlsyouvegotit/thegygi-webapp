import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import {
  ChevronLeft,
  ClipboardCheck,
  Loader2,
  Users,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { api } from "@/lib/api";
import GradingInterface from "@/components/assignments/GradingInterface";
import SubmissionList from "@/components/assignments/SubmissionList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { assignment, assignmentSubmission } from "@/types";
import { cn } from "@/lib/utils";

const Grading = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gradePanelRef = useRef<HTMLElement>(null);
  const [assignment, setAssignment] = useState<assignment | null>(null);
  const [submissions, setSubmissions] = useState<assignmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<assignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/assignments/${id}/submissions`),
      ]);
      setAssignment(assignmentRes.data.data.assignment as assignment);
      setSubmissions(
        (submissionsRes.data.data.submissions as assignmentSubmission[]) || [],
      );
    } catch (error) {
      console.error("Failed to load data:", error);
      setAssignment(null);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const graded = submissions.filter((s) => s.status === "graded").length;
    const pending = submissions.length - graded;
    return { graded, pending, total: submissions.length };
  }, [submissions]);

  const handleSelect = (submission: assignmentSubmission) => {
    setSelectedSubmission(submission);
    // On small screens, bring the grade panel into view.
    requestAnimationFrame(() => {
      gradePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-28 h-44 w-44 rounded-full bg-fuchsia-200/20 blur-3xl" />
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 h-10 w-10 shrink-0 rounded-full"
            onClick={() => navigate(`/tutor/assignments/${assignment._id}`)}
            aria-label="Back to assignment"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary">Grading</Badge>
              {assignment.category?.name ? (
                <span className="text-xs font-medium text-slate-500">
                  {assignment.category.name}
                </span>
              ) : null}
            </div>
            <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Grade Submissions
            </h1>
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
              {assignment.title}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Due {format(new Date(assignment.dueDate), "MMM d, yyyy · h:mm a")}
              {" · "}Max {assignment.maxScore} pts
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          {
            icon: Users,
            label: "Total",
            value: stats.total,
            tone: "text-slate-900",
          },
          {
            icon: Clock3,
            label: "Pending",
            value: stats.pending,
            tone: "text-amber-700",
          },
          {
            icon: CheckCircle2,
            label: "Graded",
            value: stats.graded,
            tone: "text-emerald-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4"
          >
            <stat.icon className={cn("mb-1.5 h-4 w-4 text-primary")} />
            <p className={cn("text-lg font-black sm:text-xl", stat.tone)}>
              {stat.value}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-[11px]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <section
          className={cn(
            "min-w-0 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 lg:col-span-5",
            // On mobile, hide list while actively grading to focus the panel.
            selectedSubmission && "max-lg:hidden",
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Submissions</h2>
              <p className="text-xs text-slate-500">
                Select a student to review and grade
              </p>
            </div>
          </div>
          <SubmissionList
            submissions={submissions}
            selectedId={selectedSubmission?._id}
            maxScore={assignment.maxScore}
            onGrade={handleSelect}
          />
        </section>

        <section
          ref={gradePanelRef}
          className={cn(
            "min-w-0 scroll-mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5",
            selectedSubmission ? "lg:col-span-7" : "hidden",
          )}
        >
          {selectedSubmission ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900">
                    Grade submission
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review the work, then enter a score and feedback
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0 rounded-full lg:hidden"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Back to list
                </Button>
              </div>
              <GradingInterface
                key={selectedSubmission._id}
                submission={selectedSubmission}
                maxScore={assignment.maxScore}
                onCancel={() => setSelectedSubmission(null)}
                onGraded={async () => {
                  setSelectedSubmission(null);
                  await fetchData();
                }}
              />
            </>
          ) : null}
        </section>

        {!selectedSubmission ? (
          <section className="hidden min-w-0 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center lg:col-span-7 lg:flex">
            <div>
              <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                Select a submission to start grading
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Choose a student from the list to review their work
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default Grading;
