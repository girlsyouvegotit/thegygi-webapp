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
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";

import { api } from "@/lib/api";
import { fetchAcademicYears } from "@/lib/financeFormOptions";
import {
  financeModalBodyClass,
  financeModalContentClass,
  financeModalFieldStack,
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
import type { Expense } from "@/types";

const expenseSchema = z.object({
  date: z.date(),
  category: z.enum(["salary", "utilities", "maintenance", "supplies", "other"]),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be greater than zero")
    .refine((n) => n >= 0, "Amount cannot be negative"),
  academicYearId: z.string().min(1, "Academic year is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const STEPS = ["Basics", "Amount"] as const;
const STEP_FIELDS: (keyof ExpenseFormValues)[][] = [
  ["date", "category", "description"],
  ["amount", "academicYearId"],
];

const categories = [
  { value: "salary", label: "Salary" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "supplies", label: "Supplies" },
  { value: "other", label: "Other" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Expense | null;
  onSuccess: () => void;
}

const ExpenseForm = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: Props) => {
  const [step, setStep] = useState(0);
  const [academicYears, setAcademicYears] = useState<
    { _id: string; name: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      date: new Date(),
      category: "other",
      description: "",
      amount: 0,
      academicYearId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setStep(0);
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load academic years");
      } finally {
        setLoadingOptions(false);
      }
    };
    void fetchOptions();
  }, [open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        date: new Date(initialData.date),
        category: initialData.category,
        description: initialData.description,
        amount: initialData.amount,
        academicYearId: initialData.academicYear?._id ?? "",
      });
    } else {
      form.reset({
        date: new Date(),
        category: "other",
        description: "",
        amount: 0,
        academicYearId: "",
      });
    }
  }, [initialData, form, open]);

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit: SubmitHandler<ExpenseFormValues> = async (data) => {
    try {
      if (initialData) {
        await api.put(`/finance/expenses/${initialData._id}`, data);
        toast.success("Expense record updated");
      } else {
        await api.post("/finance/expenses", data);
        toast.success("Expense record created");
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
            <Receipt className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {initialData ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            Log a school expense by category and amount.
          </DialogDescription>
          <FinanceModalSteps steps={[...STEPS]} current={step} />
        </DialogHeader>

        <form
          onSubmit={(e) => {
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
                Loading academic years…
              </div>
            )}

            <FieldGroup className={financeModalFieldStack}>
              {step === 0 && (
                <>
                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Date</FieldLabel>
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
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Category</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Description</FieldLabel>
                        <Input
                          placeholder="e.g., Electricity bill"
                          className="h-11 rounded-xl"
                          {...field}
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
                </>
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
                className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[140px]"
                disabled={pending || loadingOptions}
                onClick={() => void form.handleSubmit(onSubmit)()}
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Expense"
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

export default ExpenseForm;
