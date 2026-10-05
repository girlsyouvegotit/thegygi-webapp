import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  type FieldPath,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  Settings2,
  ListChecks,
  ClipboardCheck,
  FileQuestion,
  FolderTree,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuthContext";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
  tutors?: Array<string | { _id: string }>;
}

type QuestionType =
  | "MCQ"
  | "multiple_select"
  | "true_false"
  | "short_answer"
  | "fill_blank";

const quizSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  duration: z.coerce.number().min(1).max(300),
  passingScore: z.coerce.number().min(0).max(100),
  attempts: z.coerce.number().min(1).max(100),
  questions: z
    .array(
      z.object({
        type: z.enum([
          "MCQ",
          "multiple_select",
          "true_false",
          "short_answer",
          "fill_blank",
        ]),
        questionText: z.string().min(1, "Question text is required"),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string().min(1, "Correct answer is required"),
        points: z.coerce.number().min(1).max(100),
        explanation: z.string().optional(),
      }),
    )
    .min(1, "Add at least one question"),
});

type FormValues = z.infer<typeof quizSchema>;

interface QuizBuilderProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const STEPS = [
  {
    id: "basics",
    title: "Basics",
    subtitle: "Category, title, and description",
    icon: BookOpen,
    fields: ["categoryId", "title", "description"] as FieldPath<FormValues>[],
  },
  {
    id: "settings",
    title: "Settings",
    subtitle: "Duration, score, and attempts",
    icon: Settings2,
    fields: ["duration", "passingScore", "attempts"] as FieldPath<FormValues>[],
  },
  {
    id: "questions",
    title: "Questions",
    subtitle: "Build your question bank",
    icon: ListChecks,
    fields: ["questions"] as FieldPath<FormValues>[],
  },
  {
    id: "review",
    title: "Review",
    subtitle: "Confirm and publish",
    icon: ClipboardCheck,
    fields: [] as FieldPath<FormValues>[],
  },
] as const;

const pillInput =
  "h-12 rounded-full border-slate-200 bg-slate-50 px-5 text-base shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:h-11 sm:text-sm";

const pillTextarea =
  "min-h-28 resize-y rounded-3xl border-slate-200 bg-slate-50 px-5 py-3.5 text-base leading-relaxed shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:min-h-24 sm:text-sm";

const defaultQuestion = {
  type: "MCQ" as const,
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 1,
  explanation: "",
};

const QuizBuilder = ({ onSuccess, onCancel }: QuizBuilderProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(quizSchema) as Resolver<FormValues>,
    mode: "onTouched",
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      duration: 30,
      passingScore: 60,
      attempts: 1,
      questions: [{ ...defaultQuestion }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data } = await api.get("/categories");
      setCategories(data.data.categories as Category[]);
    } catch (error: unknown) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const availableCategories = useMemo(() => {
    if (user?.role === "admin" || user?.role === "super_admin") {
      return categories;
    }

    const userId = user?._id ? String(user._id) : "";
    const assignedIds = new Set<string>(
      [...(user?.categories ?? []), ...(user?.assignedCategories ?? [])].map(
        (c) => (typeof c === "string" ? c : c._id),
      ),
    );

    return categories.filter((cat) => {
      if (assignedIds.has(cat._id)) return true;
      return (cat.tutors ?? []).some(
        (t) => (typeof t === "string" ? t : t._id) === userId,
      );
    });
  }, [categories, user?.role, user?._id, user?.categories, user?.assignedCategories]);

  const hasNoCategories =
    !loadingCategories && availableCategories.length === 0;

  const onSubmit = async (values: FormValues) => {
    try {
      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + values.duration * 60 * 1000,
      );
      const payload = {
        ...values,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        questions: values.questions.map((q) => ({
          ...q,
          options:
            q.type === "MCQ" || q.type === "multiple_select"
              ? (q.options || []).map((o) => o.trim()).filter(Boolean)
              : undefined,
          correctAnswer:
            q.type === "multiple_select"
              ? q.correctAnswer
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : q.correctAnswer.trim(),
        })),
      };

      await api.post("/quizzes", payload);
      toast.success("Quiz created", {
        action: onSuccess
          ? {
              label: "Manage quizzes",
              onClick: () => onSuccess(),
            }
          : undefined,
      });
      form.reset({
        categoryId: values.categoryId,
        title: "",
        description: "",
        duration: 30,
        passingScore: 60,
        attempts: 1,
        questions: [{ ...defaultQuestion, options: ["", "", "", ""] }],
      });
      setStep(0);
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ field?: string; message?: string }>;
          };
        };
      };
      const details = err.response?.data?.errors
        ?.map((e) => e.message)
        .filter(Boolean)
        .slice(0, 3)
        .join(" · ");
      toast.error(
        details || err.response?.data?.message || "Failed to create quiz",
      );
    }
  };

  const watchQuestionType = (index: number): QuestionType => {
    return form.watch(`questions.${index}.type`) as QuestionType;
  };

  const addQuestion = (type: QuestionType = "MCQ") => {
    append({
      type,
      questionText: "",
      options:
        type === "MCQ" || type === "multiple_select"
          ? ["", "", "", ""]
          : undefined,
      correctAnswer: "",
      points: 1,
      explanation: "",
    });
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const current = STEPS[step];
  const CurrentIcon = current.icon;
  const isLast = step === STEPS.length - 1;
  const pending = form.formState.isSubmitting;

  const goNext = async () => {
    const fieldsToValidate = [...STEPS[step].fields];
    if (fieldsToValidate.length > 0) {
      const ok = await form.trigger(fieldsToValidate);
      if (!ok) {
        toast.error("Please fix the highlighted fields");
        return;
      }
    }
    if (step === 2) {
      const questions = form.getValues("questions");
      if (!questions.length) {
        toast.error("Add at least one question");
        return;
      }
      const ok = await form.trigger("questions");
      if (!ok) {
        toast.error("Finish all questions before continuing");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const firstErrorMessage = (errors: FieldErrors<FormValues>): string => {
    const walk = (value: unknown): string | null => {
      if (!value || typeof value !== "object") return null;
      if (
        "message" in value &&
        typeof (value as { message?: unknown }).message === "string"
      ) {
        return (value as { message: string }).message;
      }
      for (const child of Object.values(value as Record<string, unknown>)) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(errors) || "Please fix the highlighted fields";
  };

  const stepForErrors = (errors: FieldErrors<FormValues>): number => {
    if (errors.categoryId || errors.title || errors.description) return 0;
    if (errors.duration || errors.passingScore || errors.attempts) return 1;
    if (errors.questions) return 2;
    return step;
  };

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    setStep(stepForErrors(errors));
    toast.error(firstErrorMessage(errors));
  };

  const createQuiz = () => {
    void form.handleSubmit(onSubmit, onInvalid)();
  };

  const values = form.watch();
  const categoryName =
    availableCategories.find((c) => c._id === values.categoryId)?.name || "—";
  const totalPoints = (values.questions || []).reduce(
    (sum, q) => sum + (Number(q.points) || 0),
    0,
  );

  if (hasNoCategories) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <FolderTree className="h-6 w-6 text-amber-600" />
        </div>
        <p className="text-base font-bold text-slate-900">No category assigned</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          You are not currently associated with any category. Please ask an
          admin to assign you to one before creating a quiz.
        </p>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="mt-5 h-11 rounded-full px-6"
            onClick={onCancel}
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isLast) createQuiz();
        else void goNext();
      }}
      className="flex h-full min-h-0 flex-1 flex-col"
      style={{ fontSize: "16px" }}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        if (!isLast) void goNext();
      }}
    >
      {/* Step progress */}
      <div className="shrink-0 space-y-2.5 border-b border-slate-100 px-1 pb-3 sm:space-y-3 sm:pb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="font-bold text-primary">{current.title}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between gap-1.5 sm:gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (i < step) setStep(i);
                }}
                className={cn(
                  "flex min-h-10 min-w-10 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition sm:min-h-9 sm:flex-row sm:gap-1.5 sm:rounded-full sm:text-[11px]",
                  i < step && "bg-primary text-white",
                  i === step &&
                    "bg-primary/15 text-primary ring-2 ring-primary/30",
                  i > step && "bg-slate-100 text-slate-400",
                )}
                aria-label={`Go to ${s.title}`}
                title={s.title}
              >
                {i < step ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="max-w-full truncate leading-tight sm:inline">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-start gap-3 pt-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CurrentIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {current.title}
            </h3>
            <p className="text-xs text-slate-500">{current.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Step body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 pr-1 [-webkit-overflow-scrolling:touch]">
        <div
          key={step}
          className="animate-in fade-in slide-in-from-right-2 duration-300"
        >
          {step === 0 && (
            <FieldGroup className="space-y-4">
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel>Category</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger className={cn(pillInput, "w-full")}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel>Quiz Title</FieldLabel>
                    <Input
                      placeholder="e.g., JavaScript Fundamentals"
                      className={pillInput}
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field className="gap-2">
                    <FieldLabel>Description (optional)</FieldLabel>
                    <Textarea
                      rows={3}
                      placeholder="Brief description of the quiz"
                      className={pillTextarea}
                      {...field}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          )}

          {step === 1 && (
            <FieldGroup className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Controller
                  name="duration"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2">
                      <FieldLabel>Duration (mins)</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        max={300}
                        className={pillInput}
                        {...field}
                      />
                      <p className="text-[11px] text-slate-500">
                        How long students get to finish
                      </p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="passingScore"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2">
                      <FieldLabel>Passing Score (%)</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className={pillInput}
                        {...field}
                      />
                      <p className="text-[11px] text-slate-500">
                        Minimum score to pass
                      </p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="attempts"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2">
                      <FieldLabel>Attempts</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        className={pillInput}
                        {...field}
                      />
                      <p className="text-[11px] text-slate-500">
                        Retries allowed per student
                      </p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                Students get{" "}
                <span className="font-bold text-slate-900">
                  {values.duration || 0} minutes
                </span>{" "}
                to finish once they start, need{" "}
                <span className="font-bold text-slate-900">
                  {values.passingScore || 0}%
                </span>{" "}
                to pass, and can try{" "}
                <span className="font-bold text-slate-900">
                  {values.attempts || 1}
                </span>{" "}
                time{(values.attempts || 1) === 1 ? "" : "s"}.
              </div>
            </FieldGroup>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">
                  {fields.length} question{fields.length === 1 ? "" : "s"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-full"
                  onClick={() => addQuestion("MCQ")}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Add Question
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        Question {index + 1}
                      </h4>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => remove(index)}
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Controller
                      name={`questions.${index}.type`}
                      control={form.control}
                      render={({ field: typeField }) => (
                        <Field className="gap-1.5">
                          <FieldLabel>Type</FieldLabel>
                          <Select
                            onValueChange={(value) => {
                              typeField.onChange(value);
                              if (
                                value === "MCQ" ||
                                value === "multiple_select"
                              ) {
                                const current =
                                  form.getValues(
                                    `questions.${index}.options`,
                                  ) || [];
                                if (current.length < 2) {
                                  form.setValue(
                                    `questions.${index}.options`,
                                    ["", "", "", ""],
                                  );
                                }
                              }
                            }}
                            value={typeField.value}
                          >
                            <SelectTrigger className={cn(pillInput, "w-full")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MCQ">Multiple Choice</SelectItem>
                              <SelectItem value="multiple_select">
                                Multiple Select
                              </SelectItem>
                              <SelectItem value="true_false">
                                True/False
                              </SelectItem>
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

                    <Controller
                      name={`questions.${index}.points`}
                      control={form.control}
                      render={({ field: pointsField, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="gap-1.5"
                        >
                          <FieldLabel>Points</FieldLabel>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            className={pillInput}
                            {...pointsField}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    {watchQuestionType(index) === "true_false" && (
                      <Controller
                        name={`questions.${index}.correctAnswer`}
                        control={form.control}
                        render={({ field: ansField }) => (
                          <Field className="gap-1.5">
                            <FieldLabel>Correct Answer</FieldLabel>
                            <Select
                              onValueChange={ansField.onChange}
                              value={ansField.value}
                            >
                              <SelectTrigger className={cn(pillInput, "w-full")}>
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
                    )}
                  </div>

                  <Controller
                    name={`questions.${index}.questionText`}
                    control={form.control}
                    render={({ field: qField, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="gap-1.5"
                      >
                        <FieldLabel>Question Text</FieldLabel>
                        <Textarea
                          rows={2}
                          placeholder="Enter your question"
                          className={pillTextarea}
                          {...qField}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {(watchQuestionType(index) === "MCQ" ||
                    watchQuestionType(index) === "multiple_select") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel>Options</FieldLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs"
                          onClick={() => {
                            const current =
                              form.getValues(`questions.${index}.options`) ||
                              [];
                            form.setValue(
                              `questions.${index}.options`,
                              [...current, ""],
                              { shouldDirty: true, shouldValidate: true },
                            );
                          }}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add option
                        </Button>
                      </div>
                      {(
                        form.watch(`questions.${index}.options`) || ["", ""]
                      ).map((_, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <Controller
                            name={`questions.${index}.options.${optIndex}`}
                            control={form.control}
                            render={({ field: optField }) => (
                              <Input
                                placeholder={`Option ${optIndex + 1}`}
                                className={cn(pillInput, "flex-1")}
                                {...optField}
                              />
                            )}
                          />
                          {(form.watch(`questions.${index}.options`) || [])
                            .length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 shrink-0 rounded-full"
                              aria-label={`Remove option ${optIndex + 1}`}
                              onClick={() => {
                                const current =
                                  form.getValues(
                                    `questions.${index}.options`,
                                  ) || [];
                                form.setValue(
                                  `questions.${index}.options`,
                                  current.filter((_, i) => i !== optIndex),
                                  {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  },
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {watchQuestionType(index) !== "true_false" && (
                    <Controller
                      name={`questions.${index}.correctAnswer`}
                      control={form.control}
                      render={({ field: ansField, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="gap-1.5"
                        >
                          <FieldLabel>Correct Answer</FieldLabel>
                          <Input
                            placeholder={
                              watchQuestionType(index) === "multiple_select"
                                ? "Comma-separated answers (e.g., A, C)"
                                : "Enter the correct answer"
                            }
                            className={pillInput}
                            {...ansField}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  )}

                  <Controller
                    name={`questions.${index}.explanation`}
                    control={form.control}
                    render={({ field: expField }) => (
                      <Field className="gap-1.5">
                        <FieldLabel>Explanation (optional)</FieldLabel>
                        <Textarea
                          rows={2}
                          placeholder="Explain why this is the correct answer"
                          className={pillTextarea}
                          {...expField}
                        />
                      </Field>
                    )}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-dashed"
                onClick={() => addQuestion("MCQ")}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add another question
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileQuestion className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {categoryName}
                    </p>
                    <h4 className="mt-0.5 text-lg font-black text-slate-900">
                      {values.title || "Untitled quiz"}
                    </h4>
                    {values.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {values.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Duration", value: `${values.duration || 0}m` },
                  { label: "Pass score", value: `${values.passingScore || 0}%` },
                  { label: "Attempts", value: values.attempts || 1 },
                  {
                    label: "Questions",
                    value: values.questions?.length || 0,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-bold text-slate-900">
                  Question summary · {totalPoints} pts total
                </p>
                <ul className="space-y-2">
                  {(values.questions || []).map((q, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-black text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {q.questionText || "Untitled question"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {q.type.replace("_", " ")} · {q.points} pt
                          {q.points === 1 ? "" : "s"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer stays pinned while the step body scrolls */}
      <div
        className="shrink-0 border-t border-slate-100 bg-white px-0 pt-3"
        style={{
          paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex gap-2.5 sm:gap-3">
          {step === 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-12 flex-1 rounded-full text-base sm:h-11 sm:text-sm"
              disabled={pending}
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="h-12 flex-1 rounded-full text-base sm:h-11 sm:text-sm"
              disabled={pending}
            >
              <ChevronLeft className="mr-0.5 h-4 w-4 sm:mr-1" />
              Back
            </Button>
          )}

          {isLast ? (
            <Button
              type="submit"
              disabled={pending}
              className="h-12 flex-[1.5] rounded-full text-base shadow-md shadow-primary/20 sm:h-11 sm:flex-[1.4] sm:text-sm"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Quiz"
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              className="h-12 flex-[1.5] rounded-full text-base sm:h-11 sm:flex-[1.4] sm:text-sm"
              disabled={pending}
            >
              Continue
              <ChevronRight className="ml-0.5 h-4 w-4 sm:ml-1" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default QuizBuilder;
