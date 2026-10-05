import { useState, useCallback } from "react";
import { X, Timer, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  _id: string;
  type: "MCQ" | "multiple_select" | "true_false";
  questionText: string;
  options?: string[];
  points: number;
}

interface LiveQuizPopupProps {
  quizId: string;
  question: QuizQuestion;
  timeLeft: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  onAnswer: (questionId: string, answer: string | string[]) => void;
  onClose: () => void;
}

const LiveQuizPopup = ({
  question,
  timeLeft,
  totalQuestions,
  currentQuestionIndex,
  onAnswer,
  onClose,
}: LiveQuizPopupProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>("");
  const [submitted, setSubmitted] = useState(false);

  const handleSelectOption = (option: string) => {
    if (submitted) return;

    if (question.type === "multiple_select") {
      setSelectedAnswer((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        if (current.includes(option)) {
          return current.filter((o) => o !== option);
        }
        return [...current, option];
      });
    } else {
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = useCallback(() => {
    if (!selectedAnswer || submitted) return;

    onAnswer(question._id, selectedAnswer);
    setSubmitted(true);
  }, [selectedAnswer, submitted, question._id, onAnswer]);

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-bounce-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Live Quiz</h3>
              <p className="text-white/70 text-xs">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white">{timeLeft}s</Badge>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              aria-label="Close quiz"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Question */}
        <div className="p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
            {question.questionText}
          </h4>

          {/* Options */}
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectOption(option)}
                disabled={submitted}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
                  !submitted && "hover:border-primary/50 hover:bg-primary/5",
                  submitted && "cursor-default",
                  selectedAnswer === option ||
                    (Array.isArray(selectedAnswer) &&
                      selectedAnswer.includes(option))
                    ? "border-primary bg-primary/5"
                    : "border-gray-200",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    selectedAnswer === option ||
                      (Array.isArray(selectedAnswer) &&
                        selectedAnswer.includes(option))
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {option}
                </span>
                {submitted &&
                  (selectedAnswer === option ||
                    (Array.isArray(selectedAnswer) &&
                      selectedAnswer.includes(option))) && (
                    <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
                  )}
              </button>
            ))}
          </div>

          {/* Points */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Worth {question.points} point{question.points > 1 ? "s" : ""}
          </p>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || submitted}
            className="w-full mt-4"
          >
            {submitted ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Answer Submitted
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveQuizPopup;
