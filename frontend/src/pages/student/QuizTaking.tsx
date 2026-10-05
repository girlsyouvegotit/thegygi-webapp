import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useQuiz } from "@/hooks/useQuiz";
import { SimpleSectionSkeleton } from "@/components/loading/PageSkeleton";
import {
  FileQuestion,
  Clock,
  ChevronLeft,
  Brain,
  Target,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QuizTakingInterface, {
  type QuizAnswer,
} from "@/components/quizzes/QuizTakingInterface";
import QuizResults from "@/components/quizzes/QuizResults";

const QuizTaking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quiz, submission, loading, submitQuiz, setSubmission } = useQuiz(id);
  const [reviewing, setReviewing] = useState(true);
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  useEffect(() => {
    if (submission?.attempt != null) {
      setAttemptsUsed(submission.attempt);
    }
  }, [submission?.attempt]);

  if (loading) {
    return <SimpleSectionSkeleton />;
  }

  if (!quiz) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <FileQuestion className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Quiz Not Found</h2>
        <p className="mt-1 text-sm text-gray-500">
          The quiz you&apos;re looking for doesn&apos;t exist
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate("/dashboard")}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to dashboard
        </Button>
      </div>
    );
  }

  const attemptsLeft = Math.max(0, quiz.attempts - attemptsUsed);
  const canRetry =
    !!submission && !submission.passed && attemptsLeft > 0;
  const attemptsExhausted = attemptsUsed >= quiz.attempts;

  // Show results after submit, or when attempts are exhausted / student is reviewing
  if (submission && (reviewing || attemptsExhausted || submission.passed)) {
    return (
      <QuizResults
        submission={submission}
        quiz={quiz}
        canRetry={canRetry}
        onRetry={() => {
          setReviewing(false);
          setSubmission(null);
        }}
      />
    );
  }

  if (attemptsExhausted) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mb-3 text-5xl" aria-hidden>
          😢
        </div>
        <h2 className="text-lg font-bold text-gray-900">No attempts left</h2>
        <p className="mt-1 text-sm text-gray-500">
          You have already used all {quiz.attempts} attempt
          {quiz.attempts === 1 ? "" : "s"} for this quiz.
        </p>
        <Button
          className="mt-5 rounded-full"
          onClick={() => navigate("/dashboard")}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back to dashboard
        </Button>
      </div>
    );
  }

  const handleSubmit = async (answers: QuizAnswer[]) => {
    try {
      await submitQuiz(answers);
      setReviewing(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit quiz";
      toast.error(message);
    }
  };

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-gray-500 hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{quiz.title}</h1>
            <p className="text-sm text-gray-500">{quiz.category?.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-slate-100 px-3 py-1 text-xs text-slate-700">
            {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left
          </Badge>
          <Badge className="bg-primary/10 px-3 py-1 text-xs text-primary">
            <FileQuestion className="mr-1 h-3 w-3" />
            {quiz.questions.length} Questions
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-center shadow-sm">
          <Clock className="mx-auto mb-1 h-4 w-4 text-blue-500" />
          <p className="text-sm font-bold text-gray-900">{quiz.duration} mins</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Duration
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-center shadow-sm">
          <Target className="mx-auto mb-1 h-4 w-4 text-purple-500" />
          <p className="text-sm font-bold text-gray-900">{totalPoints} pts</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Total Points
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-center shadow-sm">
          <Award className="mx-auto mb-1 h-4 w-4 text-amber-500" />
          <p className="text-sm font-bold text-gray-900">{quiz.passingScore}%</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Pass Mark
          </p>
        </div>
      </div>

      {quiz.description && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">{quiz.description}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <QuizTakingInterface quiz={quiz} onSubmit={handleSubmit} />
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#E8E1F8] to-[#FCECEF] p-4 shadow-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">Quiz Tips</p>
          <p className="text-[11px] text-gray-500">
            You have {quiz.duration} minutes and {attemptsLeft} attempt
            {attemptsLeft === 1 ? "" : "s"} remaining. Read each question
            carefully.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;
