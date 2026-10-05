import { useState, useEffect, useMemo } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2, FolderTree } from "lucide-react";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CategoryOption {
  _id: string;
  name: string;
  tutors?: Array<string | { _id: string }>;
}

const assignmentSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  dueDate: z.date(),
  maxScore: z.coerce.number().min(1).max(1000),
  submissionTypes: z
    .array(z.enum(["file", "text", "github_url"]))
    .min(1, "Select at least one submission type"),
});

type FormValues = z.infer<typeof assignmentSchema>;

interface AssignmentBuilderProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const pillInput =
  "h-12 rounded-full border-slate-200 bg-slate-50 px-5 text-base shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:h-11 sm:text-sm";

const pillTextarea =
  "min-h-32 resize-y rounded-3xl border-slate-200 bg-slate-50 px-5 py-4 text-base leading-relaxed shadow-none transition-[color,box-shadow,background-color] placeholder:text-slate-400 hover:bg-slate-100/80 focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-primary/20 sm:min-h-28 sm:text-sm";

const AssignmentBuilder = ({ onSuccess, onCancel }: AssignmentBuilderProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(assignmentSchema) as Resolver<FormValues>,
    mode: "onTouched",
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      submissionTypes: ["text"],
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data } = await api.get("/categories");
        setCategories((data.data.categories as CategoryOption[]) || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    void fetchCategories();
  }, []);

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
  }, [
    categories,
    user?.role,
    user?._id,
    user?.categories,
    user?.assignedCategories,
  ]);

  const hasNoCategories =
    !loadingCategories && availableCategories.length === 0;

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/assignments", {
        ...values,
        dueDate:
          values.dueDate instanceof Date
            ? values.dueDate.toISOString()
            : values.dueDate,
      });
      toast.success("Assignment created — you can create another anytime");
      form.reset({
        categoryId: values.categoryId,
        title: "",
        description: "",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        submissionTypes: ["text"],
      });
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to create assignment",
      );
    }
  };

  if (hasNoCategories) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <FolderTree className="h-6 w-6 text-amber-600" />
        </div>
        <p className="text-base font-bold text-slate-900">No category assigned</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          You are not currently associated with any category. Please ask an
          admin to assign you to one before creating an assignment.
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
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
      style={{ fontSize: "16px" }}
    >
      <FieldGroup className="space-y-5">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel>Assignment Title</FieldLabel>
              <Input
                placeholder="e.g., Build a Responsive Dashboard"
                className={pillInput}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2">
              <FieldLabel>Description</FieldLabel>
              <Textarea
                rows={5}
                placeholder="Describe the assignment requirements, deliverables, and any resources students should use…"
                className={pillTextarea}
                {...field}
              />
              <p className="text-[11px] text-slate-500">
                Be clear about what students need to submit and how you’ll grade
                it.
              </p>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Controller
            name="dueDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel>Due Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        pillInput,
                        "w-full justify-start font-normal",
                        !field.value && "text-slate-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto rounded-2xl p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="maxScore"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel>Max Score</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  className={pillInput}
                  {...field}
                />
                <p className="text-[11px] text-slate-500">
                  Highest points a student can earn
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="submissionTypes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-2.5">
              <FieldLabel>Submission Types</FieldLabel>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { value: "text", label: "Text" },
                  { value: "file", label: "File Upload" },
                  { value: "github_url", label: "GitHub URL" },
                ].map((type) => {
                  const checked = field.value.includes(
                    type.value as FormValues["submissionTypes"][number],
                  );
                  return (
                    <label
                      key={type.value}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                        checked
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const current = field.value;
                          if (value) {
                            field.onChange([...current, type.value]);
                          } else {
                            field.onChange(
                              current.filter((v) => v !== type.value),
                            );
                          }
                        }}
                      />
                      {type.label}
                    </label>
                  );
                })}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex gap-2.5 border-t border-slate-100 pt-5 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 rounded-full text-base sm:h-11 sm:text-sm"
          onClick={onCancel}
          disabled={form.formState.isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-12 flex-[1.4] rounded-full text-base shadow-md shadow-primary/20 sm:h-11 sm:text-sm"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create Assignment"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AssignmentBuilder;
