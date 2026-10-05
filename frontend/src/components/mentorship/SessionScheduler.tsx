import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { mentorFormGrid } from "@/lib/mentorPageStyles";
import type { mentorAssignment, user, category } from "@/types";

const sessionSchema = z.object({
  menteeId: z.string().min(1, "Mentee is required"),
  categoryId: z.string().min(1, "Category is required"),
  topic: z.string().min(3, "Topic is required"),
  description: z.string().optional(),
  scheduledDate: z.date(),
  duration: z.number().min(15).max(180),
  type: z.enum(["one_on_one", "group"]),
});

type FormValues = z.infer<typeof sessionSchema>;

interface SessionSchedulerProps {
  menteeId?: string;
  categoryId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const flattenMentees = (assignments: mentorAssignment[]): user[] => {
  const out: user[] = [];
  for (const a of assignments) {
    for (const m of a.mentees || []) out.push(m);
  }
  return out;
};

const categoryIdFor = (mentee: user): string => {
  const cat = mentee.categories?.[0];
  if (!cat) return "";
  return typeof cat === "string" ? cat : (cat as category)._id;
};

const SessionScheduler = ({
  menteeId = "",
  categoryId = "",
  onSuccess,
  onCancel,
}: SessionSchedulerProps) => {
  const [mentees, setMentees] = useState<user[]>([]);
  const [loadingMentees, setLoadingMentees] = useState(!menteeId);

  const form = useForm<FormValues>({
    resolver: zodResolver(sessionSchema) as Resolver<FormValues>,
    defaultValues: {
      menteeId,
      categoryId,
      topic: "",
      description: "",
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      duration: 45,
      type: "one_on_one",
    },
  });

  useEffect(() => {
    if (menteeId) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.get("/mentorship/my-mentees");
        if (cancelled) return;
        setMentees(flattenMentees(data.data?.assignments ?? []));
      } catch {
        if (!cancelled) toast.error("Failed to load mentees");
      } finally {
        if (!cancelled) setLoadingMentees(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [menteeId]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/mentorship/sessions", {
        ...values,
        scheduledDate: values.scheduledDate.toISOString(),
      });
      toast.success("Session scheduled successfully");
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to schedule session",
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup className="space-y-4">
        {!menteeId ? (
          <Controller
            name="menteeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Mentee</FieldLabel>
                <Select
                  disabled={loadingMentees}
                  onValueChange={(id) => {
                    field.onChange(id);
                    const m = mentees.find((x) => x._id === id);
                    if (m) {
                      form.setValue("categoryId", categoryIdFor(m), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingMentees ? "Loading…" : "Select mentee"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {mentees.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name}
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
        ) : null}

        <Controller
          name="topic"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Topic</FieldLabel>
              <Input placeholder="e.g., Portfolio Review" {...field} />
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
              <Textarea rows={3} placeholder="Session details" {...field} />
            </Field>
          )}
        />

        <div className={mentorFormGrid}>
          <Controller
            name="scheduledDate"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 w-full justify-start pl-3 text-left font-normal",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick date</span>
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

          <Controller
            name="duration"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Duration (minutes)</FieldLabel>
                <Input type="number" className="h-10" {...field} />
              </Field>
            )}
          />
        </div>

        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Session Type</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">One-on-One</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:gap-3">
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...
            </>
          ) : (
            "Schedule Session"
          )}
        </Button>
      </div>
    </form>
  );
};

export default SessionScheduler;
