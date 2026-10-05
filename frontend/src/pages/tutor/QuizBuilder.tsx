import { useNavigate } from "react-router";
import { FileQuestion } from "lucide-react";
import QuizBuilderComponent from "@/components/quizzes/QuizBuilder";
import { useAuth } from "@/hooks/useAuthContext";

const QuizBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Tutor";

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-48 w-48 rounded-full bg-fuchsia-200/30 blur-3xl" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 animate-in fade-in duration-500">
        <header className="flex shrink-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[1.75rem]">
              Hi, {firstName}!
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Create Quiz</span>
              <span className="mx-1.5 text-slate-300">|</span>
              Build a quiz for your students
            </p>
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3 sm:px-6 sm:py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Quiz wizard</h2>
              <p className="text-xs text-slate-500">
                Step through details, settings, and questions
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">

              Paginated
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-5 py-3 sm:px-6 sm:py-4">
            <QuizBuilderComponent
              onSuccess={() => navigate("/tutor/quizzes")}
              onCancel={() => navigate("/tutor/quizzes")}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuizBuilder;
