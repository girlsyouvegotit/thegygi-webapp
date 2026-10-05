import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  CalendarIcon,
  Loader2,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Check,
  Video,
  Clock,
  Clock3,
  Users,
} from "lucide-react";
import { format, isValid, startOfDay } from "date-fns";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuthContext";
import type { category } from "@/types";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const scheduleClassSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  scheduledDate: z
    .date({ error: "Date and time are required" })
    .refine((d) => isValid(d) && d.getTime() > Date.now(), {
      message: "Pick a time later than now (today is fine)",
    }),
  duration: z.number().min(15).max(300),
  maxParticipants: z.number().min(1).max(500).optional(),
  isRecordable: z.boolean().optional(),
});

type FormValues = z.infer<typeof scheduleClassSchema>;

interface ScheduleClassFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const inputClasses =
  "h-12 sm:h-11 rounded-xl border-slate-200 bg-white text-base sm:text-sm shadow-sm";

const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

const TIME_PRESETS = [
  { h: 9, m: 0, label: "9:00 AM" },
  { h: 10, m: 0, label: "10:00 AM" },
  { h: 11, m: 0, label: "11:00 AM" },
  { h: 12, m: 0, label: "12:00 PM" },
  { h: 13, m: 0, label: "1:00 PM" },
  { h: 14, m: 0, label: "2:00 PM" },
  { h: 15, m: 0, label: "3:00 PM" },
  { h: 16, m: 0, label: "4:00 PM" },
  { h: 17, m: 0, label: "5:00 PM" },
  { h: 18, m: 0, label: "6:00 PM" },
  { h: 19, m: 0, label: "7:00 PM" },
] as const;

const STEPS = [
  {
    id: "basics",
    title: "Basics",
    subtitle: "Category and class title",
    fields: ["categoryId", "title"] as const,
  },
  {
    id: "details",
    title: "Details",
    subtitle: "What students will learn",
    fields: ["description"] as const,
  },
  {
    id: "schedule",
    title: "Schedule",
    subtitle: "When the class goes live",
    fields: ["scheduledDate", "duration"] as const,
  },
  {
    id: "options",
    title: "Options",
    subtitle: "Capacity and recording",
    fields: ["maxParticipants", "isRecordable"] as const,
  },
] as const;

const defaultScheduledDate = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
};

const ScheduleClassForm = ({ onSuccess, onCancel }: ScheduleClassFormProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [step, setStep] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(scheduleClassSchema) as Resolver<FormValues>,
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      scheduledDate: defaultScheduledDate(),
      duration: 60,
      maxParticipants: 100,
      isRecordable: true,
    },
    mode: "onTouched",
  });

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data } = await api.get("/categories");
        if (!cancelled) {
          setCategories((data.data.categories as category[]) || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load categories:", error);
          toast.error("Failed to load categories");
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };

    void fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableCategories = useMemo(() => {
    if (user?.role === "admin") return categories;

    const assignedIds = new Set<string>(
      (user?.categories ?? []).map((c) => (typeof c === "string" ? c : c._id)),
    );

    return categories.filter((cat) => assignedIds.has(cat._id));
  }, [categories, user?.role, user?.categories]);

  const hasNoCategories =
    !loadingCategories && availableCategories.length === 0;

  const watched = form.watch();
  const selectedCategory = availableCategories.find(
    (c) => c._id === watched.categoryId,
  );

  const dateIsValid =
    watched.scheduledDate instanceof Date && isValid(watched.scheduledDate);
  const todayStart = startOfDay(new Date());

  const applyTime = (hours: number, minutes: number) => {
    const base = dateIsValid
      ? new Date(watched.scheduledDate)
      : defaultScheduledDate();
    base.setHours(hours, minutes, 0, 0);
    form.setValue("scheduledDate", base, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const applyNextHalfHour = () => {
    const base = dateIsValid ? new Date(watched.scheduledDate) : new Date();
    const now = new Date();
    const sameDay =
      base.getFullYear() === now.getFullYear() &&
      base.getMonth() === now.getMonth() &&
      base.getDate() === now.getDate();

    if (sameDay) {
      const next = new Date(now);
      next.setSeconds(0, 0);
      const mins = next.getMinutes();
      if (mins === 0) {
        next.setMinutes(30);
      } else if (mins <= 30) {
        next.setMinutes(30);
      } else {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      }
      base.setHours(next.getHours(), next.getMinutes(), 0, 0);
    } else {
      base.setHours(10, 0, 0, 0);
    }

    form.setValue("scheduledDate", base, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/classes", {
        ...values,
        scheduledDate: values.scheduledDate.toISOString(),
      });
      toast.success("Class scheduled successfully");
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to schedule class");
    }
  };

  const pending = form.formState.isSubmitting;
  const progress = ((step + 1) / STEPS.length) * 100;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const goNext = async () => {
    const fields = [...STEPS[step].fields];
    const ok = await form.trigger(fields);
    if (!ok) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  if (hasNoCategories) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <FolderTree className="h-6 w-6 text-amber-600" />
        </div>
        <p className="text-base font-bold text-slate-900">No category assigned</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          You are not currently associated with any category. Please ask an
          admin to assign you to one before scheduling a class.
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
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        if (!isLast) void goNext();
      }}
      className="flex min-h-[min(70vh,40rem)] flex-col"
      style={{ fontSize: "16px" }}
    >
      {/* Step progress — all screen sizes */}
      <div className="mb-5 space-y-3 sm:mb-6">
        <div className="flex items-center justify-between gap-3 text-xs">
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

        {/* Desktop: labeled stepper · Mobile: numbered dots */}
        <div className="hidden gap-2 sm:grid sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (i < step) setStep(i);
              }}
              disabled={i > step}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition",
                i < step &&
                  "cursor-pointer border-primary/20 bg-primary/5 hover:bg-primary/10",
                i === step &&
                  "border-primary/35 bg-primary/10 ring-1 ring-primary/20",
                i > step && "cursor-not-allowed border-slate-100 bg-slate-50/80",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  i < step && "bg-primary text-white",
                  i === step && "bg-primary text-white",
                  i > step && "bg-slate-200 text-slate-500",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-xs font-bold",
                    i === step ? "text-primary" : "text-slate-700",
                    i > step && "text-slate-400",
                  )}
                >
                  {s.title}
                </span>
                <span className="block truncate text-[10px] text-slate-400">
                  {s.subtitle}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between gap-1 sm:hidden">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (i < step) setStep(i);
              }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition",
                i < step && "bg-primary text-white",
                i === step &&
                  "bg-primary/15 text-primary ring-2 ring-primary/30",
                i > step && "bg-slate-100 text-slate-400",
              )}
              aria-label={`Go to ${s.title}`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
          ))}
        </div>

        <div className="sm:hidden">
          <h3 className="text-lg font-bold text-slate-900">{current.title}</h3>
          <p className="text-sm text-slate-500">{current.subtitle}</p>
        </div>
      </div>

      <div
        key={step}
        className="flex-1 animate-in fade-in slide-in-from-right-2 duration-300"
      >
        {step === 0 && (
          <FieldGroup className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-1">
                  <FieldLabel className="text-sm font-semibold text-slate-700">
                    Category
                  </FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger className={inputClasses}>
                      <SelectValue
                        placeholder={
                          loadingCategories ? "Loading…" : "Select category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem
                          key={cat._id}
                          value={cat._id}
                          className="h-11 text-base sm:h-9 sm:text-sm"
                        >
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
                <Field data-invalid={fieldState.invalid} className="sm:col-span-1">
                  <FieldLabel className="text-sm font-semibold text-slate-700">
                    Class Title
                  </FieldLabel>
                  <Input
                    placeholder="e.g., React State Management"
                    className={inputClasses}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        )}

        {step === 1 && (
          <FieldGroup>
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-sm font-semibold text-slate-700">
                    Description
                  </FieldLabel>
                  <Textarea
                    placeholder="Describe what will be covered in this class"
                    rows={6}
                    className="min-h-36 resize-y rounded-xl border-slate-200 bg-white text-base shadow-sm sm:min-h-40 sm:text-sm"
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        )}

        {step === 2 && (
          <FieldGroup className="space-y-5">
            <Controller
              name="scheduledDate"
              control={form.control}
              render={({ field, fieldState }) => {
                const valueOk =
                  field.value instanceof Date && isValid(field.value);

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="text-sm font-semibold text-slate-700">
                      Date &amp; time
                    </FieldLabel>
                    <p className="mb-3 text-xs text-slate-500">
                      Today is allowed — just pick a time later than now.
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <CalendarIcon className="h-3 w-3" />
                          Date
                        </label>
                        <Popover
                          open={calendarOpen}
                          onOpenChange={setCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start px-3 text-left font-normal",
                                inputClasses,
                                !valueOk && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                              <span className="truncate">
                                {valueOk
                                  ? format(field.value, "EEE, MMM d, yyyy")
                                  : "Pick a date"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[min(calc(100vw-2rem),20rem)] p-0"
                            align="start"
                            sideOffset={6}
                          >
                            <Calendar
                              mode="single"
                              selected={valueOk ? field.value : undefined}
                              onSelect={(date) => {
                                if (!date) return;
                                const next = new Date(date);
                                if (valueOk) {
                                  next.setHours(
                                    field.value.getHours(),
                                    field.value.getMinutes(),
                                    0,
                                    0,
                                  );
                                } else {
                                  const soon = defaultScheduledDate();
                                  next.setHours(
                                    soon.getHours(),
                                    soon.getMinutes(),
                                    0,
                                    0,
                                  );
                                }
                                field.onChange(next);
                                setCalendarOpen(false);
                              }}
                              disabled={(date) =>
                                startOfDay(date).getTime() < todayStart.getTime()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="min-w-0">
                        <label
                          htmlFor="class-time"
                          className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          <Clock3 className="h-3 w-3" />
                          Time
                        </label>
                        <Input
                          id="class-time"
                          type="time"
                          className={cn(inputClasses, "tabular-nums")}
                          value={valueOk ? format(field.value, "HH:mm") : ""}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":");
                            if (hours == null || minutes == null) return;
                            const next = new Date(
                              valueOk ? field.value : defaultScheduledDate(),
                            );
                            next.setHours(
                              parseInt(hours, 10) || 0,
                              parseInt(minutes, 10) || 0,
                              0,
                              0,
                            );
                            field.onChange(next);
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <Clock3 className="h-3 w-3" />
                        Quick time
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={applyNextHalfHour}
                          className="h-9 rounded-full bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Next slot
                        </button>
                        {TIME_PRESETS.map((slot) => {
                          const active =
                            valueOk &&
                            field.value.getHours() === slot.h &&
                            field.value.getMinutes() === slot.m;
                          return (
                            <button
                              key={slot.label}
                              type="button"
                              onClick={() => applyTime(slot.h, slot.m)}
                              className={cn(
                                "h-9 rounded-full border px-3 text-xs font-semibold transition",
                                active
                                  ? "border-primary bg-primary text-white"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                              )}
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {valueOk && (
                      <p className="mt-3 text-xs font-medium text-slate-600">
                        Starts{" "}
                        <span className="text-slate-900">
                          {format(field.value, "EEE, MMM d · h:mm a")}
                        </span>
                      </p>
                    )}

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            <Controller
              name="duration"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-sm font-semibold text-slate-700">
                    Duration{" "}
                    <span className="font-normal text-muted-foreground">
                      (minutes)
                    </span>
                  </FieldLabel>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          field.onChange(mins)
                        }
                        className={cn(
                          "h-9 rounded-full border px-3 text-xs font-semibold transition",
                          Number(field.value) === mins
                            ? "border-primary bg-primary text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={15}
                    max={300}
                    className={cn(inputClasses, "max-w-[12rem]")}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        )}

        {step === 3 && (
          <FieldGroup className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <Controller
                name="maxParticipants"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className="text-sm font-semibold text-slate-700">
                      Max Participants
                    </FieldLabel>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={500}
                      className={inputClasses}
                      {...field}
                    />
                  </Field>
                )}
              />

              <Controller
                name="isRecordable"
                control={form.control}
                render={({ field: { value, onChange, ...rest } }) => (
                  <Field>
                    <FieldLabel className="mb-1.5 text-sm font-semibold text-slate-700 sm:invisible">
                      Recording
                    </FieldLabel>
                    <label
                      htmlFor="isRecordable"
                      className={cn(
                        "flex cursor-pointer select-none items-center gap-3",
                        "h-12 rounded-xl border border-slate-200 bg-white px-4 shadow-sm",
                        "transition-colors hover:bg-slate-50",
                      )}
                    >
                      <Checkbox
                        id="isRecordable"
                        checked={value}
                        onCheckedChange={onChange}
                        {...rest}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-none text-slate-800">
                          Record this class
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-500">
                          Students can rewatch after the session
                        </span>
                      </div>
                      <Video className="h-4 w-4 shrink-0 text-primary" />
                    </label>
                  </Field>
                )}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Review
              </p>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <FolderTree className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">Category</p>
                    <p className="truncate font-semibold text-slate-900">
                      {selectedCategory?.name || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">

                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">Title</p>
                    <p className="truncate font-semibold text-slate-900">
                      {watched.title || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">When</p>
                    <p className="font-semibold text-slate-900">
                      {dateIsValid
                        ? format(watched.scheduledDate, "MMM d, yyyy · h:mm a")
                        : "—"}{" "}
                      · {watched.duration || 0} min
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">Capacity</p>
                    <p className="font-semibold text-slate-900">
                      {watched.maxParticipants || 100} students
                      {watched.isRecordable ? " · Recording on" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FieldGroup>
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-1 mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white/95 pt-4 pb-1 backdrop-blur sm:flex-row sm:items-center">
        {step === 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 w-full rounded-full text-base sm:h-11 sm:flex-1 sm:text-sm"
          >
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            className="h-12 w-full rounded-full text-base sm:h-11 sm:flex-1 sm:text-sm"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}

        {isLast ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => void form.handleSubmit(onSubmit)()}
            className="h-12 w-full rounded-full bg-primary text-base text-white shadow-md shadow-primary/25 hover:bg-primary/90 sm:h-11 sm:flex-[1.35] sm:text-sm"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling…
              </>
            ) : (
              "Schedule Class"
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void goNext()}
            className="h-12 w-full rounded-full bg-primary text-base text-white shadow-md shadow-primary/25 hover:bg-primary/90 sm:h-11 sm:flex-[1.35] sm:text-sm"
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
};

export default ScheduleClassForm;
