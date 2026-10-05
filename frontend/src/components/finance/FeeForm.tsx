import { useEffect, useState } from "react";
import {
  useForm,
  Controller,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Wallet } from "lucide-react";
import { format } from "date-fns";

import { api } from "@/lib/api";
import {
  fetchAcademicYears,
  fetchUsersByRole,
} from "@/lib/financeFormOptions";
import {
  financeModalBodyClass,
  financeModalContentClass,
  financeModalFieldStack,
  financeModalGrid,
  financeModalHeaderClass,
} from "@/lib/financeModalStyles";
import {
  FinanceModalSteps,
  financeModalFooterNavClass,
  guardSteppedFormKeyDown,
} from "@/components/finance/FinanceModalSteps";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { nonNegativeAmountInputProps } from "@/lib/financeAmount";
import type { Fee } from "@/types";

const feeSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be greater than zero")
    .refine((n) => n >= 0, "Amount cannot be negative"),
  dueDate: z.date(),
  status: z.enum(["paid", "pending", "overdue"]),
  academicYearId: z.string().min(1, "Academic year is required"),
  description: z.string().optional(),
});

type FeeFormValues = z.infer<typeof feeSchema>;

const STEPS = ["Who & amount", "Schedule", "Details"] as const;
const STEP_FIELDS: (keyof FeeFormValues)[][] = [
  ["studentId", "amount"],
  ["dueDate", "status", "academicYearId"],
  ["description"],
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Fee | null;
  onSuccess: () => void;
}

const FeeForm = ({ open, onOpenChange, initialData, onSuccess }: Props) => {
  const [step, setStep] = useState(0);
  const [students, setStudents] = useState<{ _id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<
    { _id: string; name: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeSchema) as Resolver<FeeFormValues>,
    defaultValues: {
      studentId: "",
      amount: 0,
      dueDate: new Date(),
      status: "pending",
      academicYearId: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setStep(0);
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [studentList, years] = await Promise.all([
          fetchUsersByRole("student"),
          fetchAcademicYears(),
        ]);
        setStudents(studentList);
        setAcademicYears(years);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load options");
      } finally {
        setLoadingOptions(false);
      }
    };
    void fetchOptions();
  }, [open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        studentId: initialData.student._id,
        amount: initialData.amount,
        dueDate: new Date(initialData.dueDate),
        status: initialData.status,
        academicYearId: initialData.academicYear?._id ?? "",
        description: initialData.description || "",
      });
    } else {
      form.reset({
        studentId: "",
        amount: 0,
        dueDate: new Date(),
        status: "pending",
        academicYearId: "",
        description: "",
      });
    }
  }, [initialData, form, open]);

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit: SubmitHandler<FeeFormValues> = async (data) => {
    try {
      if (initialData) {
        await api.put(`/finance/fees/${initialData._id}`, data);
        toast.success("Fee record updated");
      } else {
        await api.post("/finance/fees", data);
        toast.success("Fee record created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  const pending = form.formState.isSubmitting;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={financeModalContentClass}>
        <DialogHeader className={financeModalHeaderClass}>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {initialData ? "Edit Fee Record" : "New Fee Record"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            Enter student fee details, due date, and payment status.
          </DialogDescription>
          <FinanceModalSteps steps={[...STEPS]} current={step} />
        </DialogHeader>

        <form
          onSubmit={(e) => {
            // Never auto-submit on Enter / accidental native submit.
            // Save only via the explicit last-step button.
            e.preventDefault();
          }}
          onKeyDown={(e) =>
            guardSteppedFormKeyDown(e, {
              isLast,
              onNext: () => void goNext(),
            })
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={financeModalBodyClass}>
            {loadingOptions && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading form options…
              </div>
            )}

            <FieldGroup className={financeModalFieldStack}>
              {step === 0 && (
                <>
                  <Controller
                    name="studentId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Student</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((s) => (
                              <SelectItem key={s._id} value={s._id}>
                                {s.name}
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
                    name="amount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Amount</FieldLabel>
                        <Input
                          placeholder="0.00"
                          className="h-11 rounded-xl"
                          {...nonNegativeAmountInputProps(field)}
                        />
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
                  <Controller
                    name="dueDate"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Due Date</FieldLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "h-11 w-full justify-start rounded-xl pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
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
                  <div className={financeModalGrid}>
                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Status</FieldLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />
                    <Controller
                      name="academicYearId"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Academic Year</FieldLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loadingOptions}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {academicYears.map((y) => (
                                <SelectItem key={y._id} value={y._id}>
                                  {y.name}
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
                  </div>
                </>
              )}

              {step === 2 && (
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Description (optional)</FieldLabel>
                      <Input
                        placeholder="Tuition fee, lab fee, etc."
                        className="h-11 rounded-xl"
                        {...field}
                      />
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        Review your details, then save the fee record.
                      </p>
                    </Field>
                  )}
                />
              )}
            </FieldGroup>
          </div>

          <DialogFooter className={financeModalFooterNavClass}>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[110px]"
              onClick={() => (step === 0 ? onOpenChange(false) : goBack())}
              disabled={pending}
            >
              {step === 0 ? (
                "Cancel"
              ) : (
                <>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </>
              )}
            </Button>

            {isLast ? (
              <Button
                type="button"
                className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[150px]"
                disabled={pending || loadingOptions}
                onClick={() => void form.handleSubmit(onSubmit)()}
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Fee Record"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[120px]"
                onClick={() => void goNext()}
                disabled={loadingOptions}
              >
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeeForm;
