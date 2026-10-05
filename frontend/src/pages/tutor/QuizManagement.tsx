import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { Plus, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QuizList from "@/components/quizzes/QuizList";
import type { quiz } from "@/types";

const QuizManagement = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await api.get("/quizzes");
        setQuizzes(data.data.quizzes);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const activeCount = quizzes.filter((q) => q.isActive).length;

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 pb-6">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-24 h-44 w-44 rounded-full bg-fuchsia-200/20 blur-3xl" />
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Assessment
            </p>
            <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">
              Quizzes
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Create and manage quizzes for your students
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!loading && quizzes.length > 0 && (
            <Badge className="border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">

              {activeCount} active
            </Badge>
          )}
          <Button
            className="h-10 gap-2 rounded-xl bg-primary shadow-md shadow-primary/25 hover:bg-primary/90"
            onClick={() => navigate("/tutor/quizzes/new")}
          >
            <Plus className="h-4 w-4" />
            Create Quiz
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] sm:p-6">
        <QuizList quizzes={quizzes} loading={loading} isTutor />
      </section>
    </div>
  );
};

export default QuizManagement;
