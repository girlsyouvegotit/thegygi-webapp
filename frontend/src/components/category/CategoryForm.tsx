import { useEffect, useMemo, useRef, useState } from "react";
import {
  useForm,
  Controller,
  type FieldPath,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { categorySchema } from "@/lib/validators";
import { z } from "zod";
import type { category } from "@/types";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/global/CustomInput";
import Modal from "@/components/global/Modal";
import ImageUpload from "@/components/global/ImageUpload";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  ImageIcon,
  Award,
  SlidersHorizontal,
  ChevronsUpDown,
} from "lucide-react";

type FormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: category | null;
  onSuccess: () => void;
}

const defaultRules = {
  attendanceWeight: 40,
  quizWeight: 30,
  assignmentWeight: 30,
  passThreshold: 100,
};

const STEPS = [
  {
    id: "details",
    title: "Details",
    subtitle: "Name and description for this learning category",
    icon: BookOpen,
    fields: ["name", "description"] as const,
  },
  {
    id: "appearance",
    title: "Appearance",
    subtitle: "Optional icon and banner for the category card",
    icon: ImageIcon,
    fields: ["icon", "bannerImage"] as const,
  },
  {
    id: "phase",
    title: "Learning phase",
    subtitle: "Duration window and certificate settings",
    icon: Award,
    fields: [
      "durationWeeks",
      "certificateEnabled",
      "certificateTitle",
    ] as const,
  },
  {
    id: "rules",
    title: "Completion rules",
    subtitle: "How progress is weighted toward certification",
    icon: SlidersHorizontal,
    fields: [
      "completionRules.attendanceWeight",
      "completionRules.quizWeight",
      "completionRules.assignmentWeight",
      "completionRules.passThreshold",
    ] as const,
  },
] as const;

const pillInputClassName =
  "h-12 rounded-full border-slate-200 bg-slate-50 px-5 text-base shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:h-11 sm:text-sm";

const pillTextareaClassName =
  "min-h-32 resize-y rounded-3xl border-slate-200 bg-slate-50 px-5 py-3.5 text-base leading-relaxed shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:min-h-28 sm:text-sm";

const CategoryForm = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: CategoryFormProps) => {
  const [step, setStep] = useState(0);
  const [existingCategories, setExistingCategories] = useState<category[]>([]);
  const [nameSuggestionsOpen, setNameSuggestionsOpen] = useState(false);
  const nameFieldRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      bannerImage: "",
      durationWeeks: 8,
      certificateEnabled: true,
      certificateTitle: "",
      completionRules: defaultRules,
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open) {
      setStep(0);
      setNameSuggestionsOpen(false);
      return;
    }

    setStep(0);
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description,
        icon: initialData.icon || "",
        bannerImage: initialData.bannerImage || "",
        durationWeeks: initialData.durationWeeks ?? 8,
        certificateEnabled: initialData.certificateEnabled ?? true,
        certificateTitle: initialData.certificateTitle || "",
        completionRules: {
          ...defaultRules,
          ...(initialData.completionRules || {}),
        },
      });
    } else {
      form.reset({
        name: "",
        description: "",
        icon: "",
        bannerImage: "",
        durationWeeks: 8,
        certificateEnabled: true,
        certificateTitle: "",
        completionRules: defaultRules,
      });
    }
  }, [initialData, form, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        if (!cancelled) {
          setExistingCategories((data.data.categories as category[]) || []);
        }
      } catch {
        if (!cancelled) setExistingCategories([]);
      }
    };

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        nameFieldRef.current &&
        !nameFieldRef.current.contains(event.target as Node)
      ) {
        setNameSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        certificateTitle: values.certificateTitle?.trim() || null,
        durationWeeks: values.durationWeeks ?? null,
      };
      if (initialData) {
        await api.put(`/categories/${initialData._id}`, payload);
        toast.success("Category updated");
      } else {
        await api.post("/categories", payload);
        toast.success("Category created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to save category");
    }
  };

  const pending = form.formState.isSubmitting;
  const certEnabled = form.watch("certificateEnabled");
  const watched = form.watch();
  const nameValue = form.watch("name") || "";
  const progress = ((step + 1) / STEPS.length) * 100;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const CurrentIcon = current.icon;

  const nameSuggestions = useMemo(() => {
    const query = nameValue.trim().toLowerCase();
    return existingCategories
      .filter((cat) => {
        if (initialData && cat._id === initialData._id) return false;
        if (!query) return true;
        return (
          cat.name.toLowerCase().includes(query) ||
          cat.description?.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [existingCategories, nameValue, initialData]);

  const nameAlreadyTaken = useMemo(() => {
    const query = nameValue.trim().toLowerCase();
    if (!query) return false;
    return existingCategories.some(
      (cat) =>
        cat.name.toLowerCase() === query &&
        (!initialData || cat._id !== initialData._id),
    );
  }, [existingCategories, nameValue, initialData]);

  const goNext = async () => {
    const fields = [...STEPS[step].fields] as FieldPath<FormValues>[];
    const ok = await form.trigger(fields);
    if (!ok) return;
    setNameSuggestionsOpen(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setNameSuggestionsOpen(false);
    setStep((s) => Math.max(s - 1, 0));
  };

  const saveCategory = () => {
    void form.handleSubmit(onSubmit)();
  };

  const applySuggestion = (cat: category) => {
    form.setValue("name", cat.name, { shouldDirty: true, shouldValidate: true });
    if (!form.getValues("description")?.trim()) {
      form.setValue("description", cat.description || "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (!form.getValues("icon") && cat.icon) {
      form.setValue("icon", cat.icon);
    }
    if (!form.getValues("bannerImage") && cat.bannerImage) {
      form.setValue("bannerImage", cat.bannerImage);
    }
    setNameSuggestionsOpen(false);
  };

  return (
    <Modal
      title={initialData ? "Edit Category" : "Create Category"}
      description={current.subtitle}
      open={open}
      setOpen={onOpenChange}
      showFooter={false}
      contentClassName={cn(
        "flex max-h-[min(100dvh,920px)] w-[calc(100%-0.75rem)] flex-col gap-0 overflow-hidden p-0 sm:w-full",
        "top-auto bottom-2 left-1/2 max-w-lg translate-x-[-50%] translate-y-0 rounded-2xl",
        "sm:top-[50%] sm:bottom-auto sm:max-h-[90vh] sm:translate-y-[-50%] sm:rounded-lg",
      )}
      headerClassName="shrink-0 gap-1 border-b border-slate-100 px-4 pb-3 pt-5 text-left sm:px-6 sm:pt-6"
    >
      <form
        onSubmit={(e) => {
          // Never auto-submit on Enter / accidental native submit.
          // Save only via the explicit Create/Update button.
          e.preventDefault();
        }}
        className="flex min-h-0 flex-1 flex-col"
        style={{ fontSize: "16px" }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const tag = (e.target as HTMLElement).tagName;
          if (tag === "TEXTAREA") return;
          e.preventDefault();
          if (!isLast) void goNext();
        }}
      >
        <div className="shrink-0 space-y-2.5 border-b border-slate-50 px-4 py-3 sm:space-y-3 sm:px-6">
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
                  <span className="max-w-full truncate leading-tight sm:hidden">
                    {s.title.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="hidden items-start gap-3 sm:flex">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CurrentIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {current.title}
              </h3>
              <p className="text-sm text-slate-500">{current.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <div
            key={step}
            className="w-full min-w-0 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300"
          >
            {step === 0 && (
              <>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Category Name</FieldLabel>
                      <div className="relative" ref={nameFieldRef}>
                        <Input
                          {...field}
                          disabled={pending}
                          autoComplete="off"
                          placeholder="e.g., Web Development"
                          className={cn(pillInputClassName, "pr-11")}
                          onFocus={() => setNameSuggestionsOpen(true)}
                          onChange={(e) => {
                            field.onChange(e);
                            setNameSuggestionsOpen(true);
                          }}
                          aria-expanded={nameSuggestionsOpen}
                          aria-autocomplete="list"
                        />
                        <button
                          type="button"
                          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          onClick={() =>
                            setNameSuggestionsOpen((openState) => !openState)
                          }
                          aria-label="Show category suggestions"
                        >
                          <ChevronsUpDown className="h-4 w-4" />
                        </button>

                        {nameSuggestionsOpen && (
                          <div className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
                            {nameSuggestions.length === 0 ? (
                              <p className="px-3 py-2.5 text-xs text-slate-500">
                                {nameValue.trim()
                                  ? "No matching categories — keep typing to create a new one"
                                  : "No existing categories yet"}
                              </p>
                            ) : (
                              nameSuggestions.map((cat) => (
                                <button
                                  key={cat._id}
                                  type="button"
                                  className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/5"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => applySuggestion(cat)}
                                >
                                  <span className="text-sm font-semibold text-slate-900">
                                    {cat.name}
                                  </span>
                                  {cat.description ? (
                                    <span className="line-clamp-1 text-[11px] text-slate-500">
                                      {cat.description}
                                    </span>
                                  ) : null}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                        Suggestions appear from existing categories
                      </p>
                      {nameAlreadyTaken && !initialData ? (
                        <p className="text-[11px] font-medium text-amber-600 sm:text-xs">
                          A category with this name already exists. Pick a
                          unique name to create a new one.
                        </p>
                      ) : null}
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        {...field}
                        disabled={pending}
                        rows={5}
                        placeholder="Describe what students will learn in this category — skills, outcomes, and who it’s for."
                        className={pillTextareaClassName}
                      />
                      <div className="flex items-center justify-between gap-2 px-1">
                        <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                          Shown on category cards and certificates
                        </p>
                        <span className="text-[10px] tabular-nums text-slate-400">
                          {field.value?.length || 0}/1000
                        </span>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </>
            )}

            {step === 1 && (
              <>
                <CustomInput
                  control={form.control}
                  name="icon"
                  label="Icon (optional)"
                  placeholder="Lucide icon name or URL"
                  disabled={pending}
                  autoComplete="off"
                  className={pillInputClassName}
                />
                <CustomInput
                  control={form.control}
                  name="bannerImage"
                  label="Banner Image URL (optional)"
                  placeholder="https://..."
                  disabled={pending}
                  autoComplete="off"
                  className={pillInputClassName}
                />
                <ImageUpload
                  disabled={pending}
                  onUploadComplete={(url) => form.setValue("bannerImage", url)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <div className="w-full min-w-0 space-y-2">
                  <CustomInput
                    control={form.control}
                    name="durationWeeks"
                    label="Duration (weeks)"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={104}
                    disabled={pending}
                    className={pillInputClassName}
                  />
                  <p className="w-full min-w-0 px-1 text-pretty wrap-break-word text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                    Deadline starts from each student&apos;s enrollment date
                  </p>
                </div>

                <Controller
                  control={form.control}
                  name="certificateEnabled"
                  render={({ field }) => (
                    <div className="w-full min-w-0 space-y-2.5 rounded-2xl border border-border bg-muted/30 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label
                          htmlFor="certificate-enabled"
                          className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground"
                        >
                          Issue certificate on completion
                        </label>
                        <Switch
                          id="certificate-enabled"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          disabled={pending}
                          className="shrink-0"
                        />
                      </div>
                      <p className="w-full min-w-0 text-pretty wrap-break-word text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                        Award a virtual certificate when the student finishes
                        the phase
                      </p>
                    </div>
                  )}
                />

                {certEnabled && (
                  <CustomInput
                    control={form.control}
                    name="certificateTitle"
                    label="Certificate title"
                    placeholder="Certificate of Completion — Web Development"
                    disabled={pending}
                    autoComplete="off"
                    className={pillInputClassName}
                  />
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CustomInput
                    control={form.control}
                    name="completionRules.attendanceWeight"
                    label="Attendance %"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    disabled={pending}
                    className={pillInputClassName}
                  />
                  <CustomInput
                    control={form.control}
                    name="completionRules.quizWeight"
                    label="Quiz %"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    disabled={pending}
                    className={pillInputClassName}
                  />
                  <CustomInput
                    control={form.control}
                    name="completionRules.assignmentWeight"
                    label="Assignment %"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    disabled={pending}
                    className={pillInputClassName}
                  />
                  <CustomInput
                    control={form.control}
                    name="completionRules.passThreshold"
                    label="Pass threshold %"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    disabled={pending}
                    className={pillInputClassName}
                  />
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-slate-50 p-3 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Review
                  </p>
                  <p className="text-sm font-bold text-slate-900 wrap-break-word">
                    {watched.name || "Untitled category"}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-3">
                    {watched.description || "No description"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-500 sm:gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                      {watched.durationWeeks ?? "—"} weeks
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                      {watched.certificateEnabled
                        ? "Certificate on"
                        : "Certificate off"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                      Pass at {watched.completionRules?.passThreshold ?? 100}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="sticky bottom-0 shrink-0 border-t border-slate-100 bg-white/95 px-4 pt-3 backdrop-blur supports-backdrop-filter:bg-white/90 sm:px-6 sm:pt-4"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex gap-2.5 sm:gap-3">
            {step === 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                key="save-category"
                type="button"
                disabled={pending}
                onClick={saveCategory}
                className="h-12 flex-[1.5] rounded-full text-base shadow-md shadow-primary/20 sm:h-11 sm:flex-[1.4] sm:text-sm"
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : initialData ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            ) : (
              <Button
                key="continue-step"
                type="button"
                onClick={() => void goNext()}
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
    </Modal>
  );
};

export default CategoryForm;
