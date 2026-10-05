import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

const feedbackSchema = z.object({
  menteeId: z.string().min(1, "Mentee is required"),
  categoryId: z.string().min(1, "Category is required"),
  projectTitle: z.string().min(3, "Project title is required"),
  technicalSkills: z.number().min(0).max(10),
  uiUx: z.number().min(0).max(10).optional(),
  problemSolving: z.number().min(0).max(10).optional(),
  communication: z.number().min(0).max(10).optional(),
  overall: z.number().min(0).max(10),
  feedback: z.string().min(1, "Feedback is required"),
  recommendations: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  menteeId: string;
  categoryId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FeedbackForm = ({
  menteeId,
  categoryId,
  onSuccess,
  onCancel,
}: FeedbackFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(feedbackSchema) as Resolver<FormValues>,
    defaultValues: {
      menteeId,
      categoryId,
      projectTitle: "",
      technicalSkills: 5,
      uiUx: 5,
      problemSolving: 5,
      communication: 5,
      overall: 5,
      feedback: "",
      recommendations: [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/mentorship/feedback", values);
      toast.success("Feedback provided successfully");
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to provide feedback");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup className="space-y-4">
        <Controller
          name="projectTitle"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Project Title</FieldLabel>
              <Input placeholder="e.g., E-commerce Dashboard" {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="technicalSkills"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Technical Skills (0-10)</FieldLabel>
                <Input type="number" min={0} max={10} {...field} />
              </Field>
            )}
          />
          <Controller
            name="uiUx"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>UI/UX (0-10)</FieldLabel>
                <Input type="number" min={0} max={10} {...field} />
              </Field>
            )}
          />
          <Controller
            name="problemSolving"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Problem Solving (0-10)</FieldLabel>
                <Input type="number" min={0} max={10} {...field} />
              </Field>
            )}
          />
          <Controller
            name="communication"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Communication (0-10)</FieldLabel>
                <Input type="number" min={0} max={10} {...field} />
              </Field>
            )}
          />
        </div>

        <Controller
          name="overall"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Overall Score (0-10)</FieldLabel>
              <Input type="number" min={0} max={10} {...field} />
            </Field>
          )}
        />

        <Controller
          name="feedback"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Feedback</FieldLabel>
              <Textarea
                rows={4}
                placeholder="Provide detailed feedback"
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </div>
    </form>
  );
};

export default FeedbackForm;
