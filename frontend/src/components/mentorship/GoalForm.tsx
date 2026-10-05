import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, CalendarIcon } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const goalSchema = z.object({
  menteeId: z.string().min(1, "Mentee is required"),
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  targetDate: z.date(),
  milestones: z.array(
    z.object({
      title: z.string().min(1, "Milestone title is required"),
    }),
  ),
});

type FormValues = z.infer<typeof goalSchema>;

interface GoalFormProps {
  menteeId: string;
  categoryId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GoalForm = ({
  menteeId,
  categoryId,
  onSuccess,
  onCancel,
}: GoalFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      menteeId,
      categoryId,
      title: "",
      description: "",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      milestones: [{ title: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "milestones",
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/mentorship/goals", values);
      toast.success("Goal created successfully");
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to create goal");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup className="space-y-4">
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Goal Title</FieldLabel>
              <Input
                placeholder="e.g., Build production-ready portfolio"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Description (optional)</FieldLabel>
              <Textarea rows={3} placeholder="Describe the goal" {...field} />
            </Field>
          )}
        />

        <Controller
          name="targetDate"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Target Date</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full pl-3 text-left font-normal")}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto max-w-[calc(100vw-2rem)] p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
          )}
        />

        <div>
          <FieldLabel>Milestones</FieldLabel>
          <div className="space-y-2 mt-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex min-w-0 gap-2">
                <Controller
                  name={`milestones.${index}.title`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="min-w-0 flex-1">
                      <Input
                        placeholder={`Milestone ${index + 1}`}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </div>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => remove(index)}
                  aria-label={`Remove milestone ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ title: "" })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Milestone
          </Button>
        </div>
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:flex-1"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create Goal"
          )}
        </Button>
      </div>
    </form>
  );
};

export default GoalForm;
