import { useState, useEffect } from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { quiz, quizQuestion } from "@/types";

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

interface QuizTakingInterfaceProps {
  quiz: quiz;
  onSubmit: (answers: QuizAnswer[]) => void;
  submitting?: boolean;
}

// Renders for `multiple_select` question types.
const MultipleSelectOptions = ({
  question,
  selected,
  onChange,
}: {
  question: quizQuestion;
  selected: string[];
  onChange: (next: string[]) => void;
}) => (
  <div className="space-y-2">
    {question.options?.map((option, index) => {
      const checked = selected.includes(option);
      return (
        <label
          key={index}
          className={cn(
            "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all",
            checked
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted",
          )}
        >
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => {
              if (value) onChange([...selected, option]);
              else onChange(selected.filter((o) => o !== option));
            }}
          />
          <span className="text-sm flex-1">{option}</span>
        </label>
      );
    })}
  </div>
);

// Renders for every non-multi-select question type.
const SingleSelectOptions = ({
  question,
  selected,
  onChange,
}: {
  question: quizQuestion;
  selected: string | undefined;
  onChange: (next: string) => void;
}) => (
  <RadioGroup value={selected} onValueChange={onChange}>
    {question.options?.map((option, index) => (
      <div
        key={index}
        className={cn(
          "flex items-center space-x-2 p-3 rounded-md border transition-all",
          selected === option
            ? "border-primary bg-primary/5"
            : "border-border hover:bg-muted",
        )}
      >
        <RadioGroupItem value={option} id={`option-${index}`} />
        <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
          {option}
        </Label>
      </div>
    ))}
  </RadioGroup>
);

const QuizTakingInterface = ({
  quiz,
  onSubmit,
  submitting,
}: QuizTakingInterfaceProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  const handleSingleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleMultiAnswer = (questionId: string, next: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers: QuizAnswer[] = Object.entries(answers).map(
      ([questionId, answer]) => ({ questionId, answer }),
    );
    onSubmit(formattedAnswers);
  };

  const question = quiz.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </p>
              <Progress value={progress} className="h-2 mt-2 w-48" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </CardContent>
      </Card>

      {question && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{question.questionText}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {question.points} point{question.points > 1 ? "s" : ""}
              {question.type === "multiple_select" && (
                <span className="ml-2 text-primary">Select all that apply</span>
              )}
            </p>
          </CardHeader>
          <CardContent>
            {question.type === "multiple_select" ? (
              <MultipleSelectOptions
                question={question}
                selected={
                  Array.isArray(answers[question._id])
                    ? (answers[question._id] as string[])
                    : []
                }
                onChange={(next) => handleMultiAnswer(question._id, next)}
              />
            ) : (
              <SingleSelectOptions
                question={question}
                selected={
                  typeof answers[question._id] === "string"
                    ? (answers[question._id] as string)
                    : undefined
                }
                onChange={(next) => handleSingleAnswer(question._id, next)}
              />
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous
        </Button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <Button onClick={handleNext}>
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < quiz.questions.length}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, index) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestion(index)}
                className={cn(
                  "w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  index === currentQuestion
                    ? "bg-primary text-primary-foreground"
                    : answers[q._id]
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTakingInterface;
