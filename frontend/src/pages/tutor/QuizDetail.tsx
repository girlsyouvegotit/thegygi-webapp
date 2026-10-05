import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import {
  ChevronLeft,
  Clock,
  FileQuestion,
  Target,
  Users,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { quiz, quizSubmission } from "@/types";

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<quiz | null>(null);
  const [submissions, setSubmissions] = useState<quizSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [quizRes, resultsRes] = await Promise.all([
          api.get(`/quizzes/${id}`),
          api.get(`/quizzes/${id}/results`).catch(() => null),
        ]);
        if (cancelled) return;
        setQuiz(quizRes.data.data.quiz as quiz);
        setSubmissions(
          (resultsRes?.data?.data?.submissions as quizSubmission[]) || [],
        );
      } catch {
        if (!cancelled) setQuiz(null);
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

  if (!quiz) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <FileQuestion className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h1 className="text-lg font-bold text-slate-900">Quiz not found</h1>
        <Button
          className="mt-4 rounded-full"
          variant="outline"
          onClick={() => navigate("/tutor/quizzes")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to quizzes
        </Button>
      </div>
    );
  }

  const passedCount = submissions.filter((s) => s.passed).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-8">
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5 h-10 w-10 rounded-full"
          onClick={() => navigate("/tutor/quizzes")}
          aria-label="Back to quizzes"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                quiz.isActive
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-slate-500/10 text-slate-600"
              }
            >
              {quiz.isActive ? "Active" : "Inactive"}
            </Badge>
            {quiz.category?.name && (
              <span className="text-xs font-medium text-slate-500">
                {quiz.category.name}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {quiz.title}
          </h1>
          {quiz.description ? (
            <p className="mt-1 text-sm text-slate-500">{quiz.description}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: FileQuestion,
            label: "Questions",
            value: quiz.questions?.length || 0,
          },
          {
            icon: Clock,
            label: "Duration",
            value: `${quiz.duration} min`,
          },
          {
            icon: Target,
            label: "Pass mark",
            value: `${quiz.passingScore}%`,
          },
          {
            icon: Users,
            label: "Attempts allowed",
            value: quiz.attempts,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <item.icon className="mb-2 h-4 w-4 text-primary" />
            <p className="text-lg font-black text-slate-900">{item.value}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Submissions</h2>
            <p className="text-xs text-slate-500">
              {submissions.length} total · {passedCount} passed
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
                    Attempt {sub.attempt} ·{" "}
                    {format(new Date(sub.submittedAt), "MMM d, h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {sub.percentage}%
                  </span>
                  <Badge
                    className={
                      sub.passed
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-rose-500/10 text-rose-700"
                    }
                  >
                    {sub.passed ? "Passed" : "Failed"}
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

export default QuizDetail;
