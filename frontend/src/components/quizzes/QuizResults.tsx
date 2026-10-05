import { useNavigate } from "react-router";
import { ChevronLeft, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { quiz, quizSubmission } from "@/types";

interface QuizResultsProps {
  submission: quizSubmission;
  quiz?: quiz | null;
  canRetry?: boolean;
  onRetry?: () => void;
}

type PerformanceTier = "fail" | "average" | "pass";

const ordinal = (n: number): string => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

const getPerformance = (
  percentage: number,
  passed: boolean,
  passingScore: number,
): PerformanceTier => {
  if (!passed || percentage < passingScore) return "fail";
  if (percentage >= 85) return "pass";
  return "average";
};

const getResultCopy = ({
  tier,
  attempt,
  attemptsLeft,
  canRetry,
}: {
  tier: PerformanceTier;
  attempt: number;
  attemptsLeft: number;
  canRetry: boolean;
}): { emoji: string; title: string; message: string; badge: string; badgeClass: string } => {
  if (tier === "pass") {
    if (attempt === 1) {
      return {
        emoji: "🎉",
        title: "You nailed it!",
        message:
          "First try and you already crushed it. That kind of focus is rare — keep this energy going!",
        badge: "Brilliant",
        badgeClass: "bg-emerald-100 text-emerald-700",
      };
    }
    return {
      emoji: "🎉",
      title: "You did it!",
      message:
        "Look at that comeback. Every attempt made you sharper, and it shows. Celebrate this win!",
      badge: "Crushed it",
      badgeClass: "bg-emerald-100 text-emerald-700",
    };
  }

  if (tier === "average") {
    if (attempt === 1) {
      return {
        emoji: "🙂",
        title: "You passed — nice work!",
        message:
          "A solid first attempt. You've cleared the bar, and with a little more practice you can push even higher.",
        badge: "Passed",
        badgeClass: "bg-amber-100 text-amber-800",
      };
    }
    return {
      emoji: "🙂",
      title: "Progress looks good",
      message:
        "You passed, and you're clearly learning from each try. Keep going — top scores are within reach.",
      badge: "On track",
      badgeClass: "bg-amber-100 text-amber-800",
    };
  }

  // fail
  if (canRetry && attempt === 1) {
    return {
      emoji: "💪",
      title: "Keep your chin up",
      message:
        "This is just your first attempt, don't feel bad. You can always try again. Don't give up!",
      badge: "Keep going",
      badgeClass: "bg-sky-100 text-sky-800",
    };
  }

  if (canRetry && attemptsLeft > 0) {
    return {
      emoji: "🌱",
      title: "You're still in this",
      message: `That was your ${ordinal(attempt)} attempt — every try teaches you something new. You still have ${attemptsLeft} chance${attemptsLeft === 1 ? "" : "s"} left. Don't give up!`,
      badge: "Almost there",
      badgeClass: "bg-sky-100 text-sky-800",
    };
  }

  return {
    emoji: "🤗",
    title: "Be kind to yourself",
    message:
      "You gave it your all, and that matters. Review what felt tricky, rest a bit, and come back stronger next time.",
    badge: "Well fought",
    badgeClass: "bg-violet-100 text-violet-800",
  };
};

const QuizResults = ({
  submission,
  quiz,
  canRetry = false,
  onRetry,
}: QuizResultsProps) => {
  const navigate = useNavigate();
  const percentage = submission.percentage;
  const passingScore =
    quiz?.passingScore ??
    (typeof submission.quiz === "object" && submission.quiz
      ? submission.quiz.passingScore
      : 60);
  const maxAttempts = quiz?.attempts ?? 1;
  const tier = getPerformance(percentage, submission.passed, passingScore);
  const attemptsLeft = Math.max(0, maxAttempts - submission.attempt);
  const copy = getResultCopy({
    tier,
    attempt: submission.attempt,
    attemptsLeft,
    canRetry,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <div
            className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-5xl"
            aria-hidden
          >
            {copy.emoji}
          </div>
          <h2 className="mb-2 text-3xl font-bold">{copy.title}</h2>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            {copy.message}
          </p>
          <div className="mb-2 flex items-center justify-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <span className="text-4xl font-bold">{percentage}%</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            You scored {submission.score} out of {submission.totalPoints}
          </p>
          <Progress value={percentage} className="mt-2 h-3" />
          <Badge className={`${copy.badgeClass} mt-4`}>{copy.badge}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{submission.attempt}</p>
              <p className="text-xs text-muted-foreground">Attempt used</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{attemptsLeft}</p>
              <p className="text-xs text-muted-foreground">Attempts left</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {submission.score}/{submission.totalPoints}
              </p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-full"
          onClick={() => navigate("/dashboard")}
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Back to dashboard
        </Button>
        {canRetry && onRetry ? (
          <Button
            type="button"
            className="h-11 flex-1 rounded-full"
            onClick={onRetry}
          >
            Try again ({attemptsLeft} left)
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default QuizResults;
