import { useState } from "react";
import { FileQuestion, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { practiceQuestion } from "@/types";

interface PracticeQuestionsProps {
  questions: practiceQuestion[];
}

const PracticeQuestions = ({ questions }: PracticeQuestionsProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showResults, setShowResults] = useState(false);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileQuestion className="h-8 w-8 mx-auto mb-2" />
          <p>Practice questions not available yet</p>
        </CardContent>
      </Card>
    );
  }

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileQuestion className="h-4 w-4 text-primary" />
            Practice Questions
            <span className="text-xs text-muted-foreground">
              (AI Generated)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="space-y-3">
                <p className="font-medium text-sm">
                  {qIndex + 1}. {question.question}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[qIndex] === option;
                    const isCorrect = option === question.correctAnswer;
                    const showCorrect = showResults && isCorrect;
                    const showWrong = showResults && isSelected && !isCorrect;

                    return (
                      <button
                        key={oIndex}
                        onClick={() =>
                          !showResults && handleAnswerSelect(qIndex, option)
                        }
                        disabled={showResults}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          isSelected && !showResults
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted",
                          showCorrect && "border-green-500 bg-green-50",
                          showWrong && "border-red-500 bg-red-50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{option}</span>
                          {showCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {showWrong && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {showResults && question.explanation && (
                  <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
                    {question.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-6">
            {!showResults ? (
              <Button onClick={handleSubmit} className="flex-1">
                Check Answers
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeQuestions;
