import { useState, useCallback } from "react";
import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Define proper types
export type QuestionType =
  | "MCQ"
  | "multiple_select"
  | "true_false"
  | "short_answer"
  | "fill_blank";

export interface QuestionFormData {
  type: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface QuestionBuilderProps {
  questions: QuestionFormData[];
  onChange: (questions: QuestionFormData[]) => void;
  maxQuestions?: number;
  disabled?: boolean;
}

const questionSchema = z.object({
  type: z.enum([
    "MCQ",
    "multiple_select",
    "true_false",
    "short_answer",
    "fill_blank",
  ]),
  questionText: z
    .string()
    .min(1, "Question text is required")
    .max(1000, "Question text too long"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  points: z.number().min(1, "Min 1 point").max(100, "Max 100 points"),
  explanation: z.string().max(2000, "Explanation too long").optional(),
});

interface QuestionFormValues {
  questions: QuestionFormData[];
}

const questionsFormSchema = z.object({ questions: z.array(questionSchema) });

const QuestionBuilder = ({
  questions,
  onChange,
  maxQuestions = 500,
  disabled = false,
}: QuestionBuilderProps) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(
    0,
  );
  const [generatingAI, setGeneratingAI] = useState(false);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionsFormSchema) as Resolver<QuestionFormValues>,
    defaultValues: {
      questions:
        questions.length > 0
          ? questions
          : [
              {
                type: "MCQ",
                questionText: "",
                options: ["", "", "", ""],
                correctAnswer: "",
                points: 1,
                explanation: "",
              },
            ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const handleQuestionsChange = useCallback(() => {
    const currentQuestions = form.getValues("questions");
    onChange(currentQuestions);
  }, [form, onChange]);

  const addQuestion = useCallback(
    (type: QuestionType = "MCQ") => {
      const newQuestion: QuestionFormData = {
        type,
        questionText: "",
        options:
          type === "MCQ" || type === "multiple_select"
            ? ["", "", "", ""]
            : undefined,
        correctAnswer: "",
        points: 1,
        explanation: "",
      };
      append(newQuestion);
      setActiveQuestionIndex(fields.length);
      handleQuestionsChange();
    },
    [append, fields.length, handleQuestionsChange],
  );

  const duplicateQuestion = useCallback(
    (index: number) => {
      const questionToDuplicate = form.getValues(`questions.${index}`);
      append({
        ...questionToDuplicate,
        questionText: `${questionToDuplicate.questionText} (Copy)`,
      });
      setActiveQuestionIndex(fields.length);
      handleQuestionsChange();
    },
    [append, fields.length, form, handleQuestionsChange],
  );

  const removeQuestion = useCallback(
    (index: number) => {
      remove(index);
      setActiveQuestionIndex((prev) => {
        if (prev === null) return null;
        if (prev === index) return Math.min(prev, fields.length - 2);
        if (prev > index) return prev - 1;
        return prev;
      });
      handleQuestionsChange();
    },
    [remove, fields.length, handleQuestionsChange],
  );

  const moveQuestion = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= fields.length) return;
      move(from, to);
      setActiveQuestionIndex(to);
      handleQuestionsChange();
    },
    [move, fields.length, handleQuestionsChange],
  );

  const generateAIQuestion = useCallback(async () => {
    setGeneratingAI(true);
    try {
      // This would call an AI endpoint to generate a question
      // For now, just show a toast
      toast.info("AI question generation coming soon");
    } catch (error: unknown) {
      console.error("Failed to generate AI question:", error);
      toast.error("Failed to generate AI question");
    } finally {
      setGeneratingAI(false);
    }
  }, []);

  const getQuestionTypeBadge = (type: QuestionType) => {
    const typeConfig: Record<
      QuestionType,
      { label: string; className: string }
    > = {
      MCQ: { label: "Multiple Choice", className: "bg-blue-100 text-blue-700" },
      multiple_select: {
        label: "Multiple Select",
        className: "bg-purple-100 text-purple-700",
      },
      true_false: {
        label: "True/False",
        className: "bg-green-100 text-green-700",
      },
      short_answer: {
        label: "Short Answer",
        className: "bg-orange-100 text-orange-700",
      },
      fill_blank: {
        label: "Fill in Blank",
        className: "bg-pink-100 text-pink-700",
      },
    };
    return typeConfig[type];
  };

  const renderOptions = (index: number, type: QuestionType) => {
    if (type === "MCQ" || type === "multiple_select") {
      return (
        <div className="space-y-2">
          <FieldLabel>Options</FieldLabel>
          {[0, 1, 2, 3].map((optIndex) => (
            <Controller
              key={optIndex}
              name={`questions.${index}.options.${optIndex}`}
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                      {String.fromCharCode(65 + optIndex)}.
                    </span>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                      {...field}
                      disabled={disabled}
                      className={fieldState?.invalid ? "border-red-500" : ""}
                    />
                  </div>
                </div>
              )}
            />
          ))}
        </div>
      );
    }

    if (type === "true_false") {
      return (
        <Controller
          name={`questions.${index}.correctAnswer`}
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Correct Answer</FieldLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select answer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      );
    }

    if (type === "fill_blank") {
      return (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">
            Use <code className="bg-background px-1 rounded">____</code> in the
            question text to indicate the blank
          </p>
        </div>
      );
    }

    return null;
  };

  const renderCorrectAnswerInput = (index: number, type: QuestionType) => {
    if (type === "true_false") return null; // Already handled above

    if (type === "short_answer" || type === "fill_blank") {
      return (
        <Controller
          name={`questions.${index}.correctAnswer`}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Correct Answer</FieldLabel>
              <Input
                placeholder="Enter the correct answer"
                {...field}
                disabled={disabled}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      );
    }

    return (
      <Controller
        name={`questions.${index}.correctAnswer`}
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Correct Answer</FieldLabel>
            <Input
              placeholder={
                type === "multiple_select"
                  ? "Comma-separated letters (e.g., A, C)"
                  : "Enter the correct option letter (e.g., B)"
              }
              {...field}
              disabled={disabled}
            />
            {type === "MCQ" && (
              <p className="text-xs text-muted-foreground mt-1">
                Enter the letter of the correct option (A, B, C, or D)
              </p>
            )}
            {type === "multiple_select" && (
              <p className="text-xs text-muted-foreground mt-1">
                Enter comma-separated letters for multiple correct answers
              </p>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Question list */}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const questionType = form.watch(
            `questions.${index}.type`,
          ) as QuestionType;
          const typeBadge = getQuestionTypeBadge(questionType);
          const isActive = activeQuestionIndex === index;

          return (
            <Card
              key={field.id}
              className={cn(
                "transition-all",
                isActive && "border-primary ring-2 ring-primary/20",
              )}
            >
              <CardContent className="p-4 space-y-4">
                {/* Question header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="cursor-grab text-muted-foreground hover:text-foreground"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <h4 className="font-semibold">Question {index + 1}</h4>
                    <Badge className={typeBadge.className}>
                      {typeBadge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(index, index - 1)}
                      disabled={index === 0 || disabled}
                      className="h-8 w-8"
                      aria-label="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(index, index + 1)}
                      disabled={index === fields.length - 1 || disabled}
                      className="h-8 w-8"
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => duplicateQuestion(index)}
                      disabled={disabled || fields.length >= maxQuestions}
                      className="h-8 w-8"
                      aria-label="Duplicate question"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(index)}
                        disabled={disabled}
                        className="h-8 w-8"
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Question type */}
                <Controller
                  name={`questions.${index}.type`}
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Question Type</FieldLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value as QuestionType);
                          // Reset options for certain types
                          if (value === "true_false") {
                            form.setValue(
                              `questions.${index}.options`,
                              undefined,
                            );
                          } else if (
                            value === "MCQ" ||
                            value === "multiple_select"
                          ) {
                            if (!form.getValues(`questions.${index}.options`)) {
                              form.setValue(`questions.${index}.options`, [
                                "",
                                "",
                                "",
                                "",
                              ]);
                            }
                          }
                          handleQuestionsChange();
                        }}
                        value={field.value}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCQ">Multiple Choice</SelectItem>
                          <SelectItem value="multiple_select">
                            Multiple Select
                          </SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">
                            Short Answer
                          </SelectItem>
                          <SelectItem value="fill_blank">
                            Fill in Blank
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                {/* Question text */}
                <Controller
                  name={`questions.${index}.questionText`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Question Text</FieldLabel>
                      <Textarea
                        rows={2}
                        placeholder="Enter your question here..."
                        {...field}
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e);
                          handleQuestionsChange();
                        }}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Options */}
                {renderOptions(index, questionType)}

                {/* Correct answer */}
                {renderCorrectAnswerInput(index, questionType)}

                {/* Points and explanation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    name={`questions.${index}.points`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Points</FieldLabel>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          {...field}
                          disabled={disabled}
                          onChange={(e) => {
                            field.onChange(e);
                            handleQuestionsChange();
                          }}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="md:col-span-2">
                    <Controller
                      name={`questions.${index}.explanation`}
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Explanation (optional)</FieldLabel>
                          <Input
                            placeholder="Explain why this is the correct answer"
                            {...field}
                            disabled={disabled}
                            onChange={(e) => {
                              field.onChange(e);
                              handleQuestionsChange();
                            }}
                          />
                        </Field>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => addQuestion("MCQ")}
          disabled={disabled || fields.length >= maxQuestions}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add MCQ
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => addQuestion("multiple_select")}
          disabled={disabled || fields.length >= maxQuestions}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Multiple Select
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => addQuestion("true_false")}
          disabled={disabled || fields.length >= maxQuestions}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add True/False
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => addQuestion("short_answer")}
          disabled={disabled || fields.length >= maxQuestions}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Short Answer
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={generateAIQuestion}
          disabled={disabled || generatingAI || fields.length >= maxQuestions}
        >
          {generatingAI ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>

              AI Generate
            </>
          )}
        </Button>
      </div>

      {/* Question count */}
      <p className="text-xs text-muted-foreground">
        {fields.length} / {maxQuestions} questions
        {fields.length > 0 && (
          <span className="ml-2">
            Total points:{" "}
            <span className="font-bold text-foreground">
              {fields.reduce((sum, _, index) => {
                const points = form.watch(`questions.${index}.points`);
                return sum + (parseInt(points as unknown as string) || 0);
              }, 0)}
            </span>
          </span>
        )}
      </p>
    </div>
  );
};

export default QuestionBuilder;
