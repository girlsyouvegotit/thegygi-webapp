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
  Banknote,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

import { api } from "@/lib/api";
import {
  fetchAcademicYears,
  fetchSalaryEmployees,
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
import { nonNegativeAmountInputProps } from "@/lib/financeAmount";
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
import type { Salary } from "@/types";

const salarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be greater than zero")
    .refine((n) => n >= 0, "Amount cannot be negative"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  status: z.enum(["paid", "pending"]),
  paymentDate: z.date().optional(),
  academicYearId: z.string().min(1, "Academic year is required"),
});

type SalaryFormValues = z.infer<typeof salarySchema>;

const STEPS = ["Employee", "Period", "Payment"] as const;
const STEP_FIELDS: (keyof SalaryFormValues)[][] = [
  ["employeeId", "amount"],
  ["month", "year", "academicYearId"],
  ["status", "paymentDate"],
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Salary | null;
  onSuccess: () => void;
}

const SalaryForm = ({ open, onOpenChange, initialData, onSuccess }: Props) => {
  const [step, setStep] = useState(0);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>(
    [],
  );
  const [academicYears, setAcademicYears] = useState<
    { _id: string; name: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salarySchema) as Resolver<SalaryFormValues>,
    defaultValues: {
      employeeId: "",
      amount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      status: "pending",
      paymentDate: undefined,
      academicYearId: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setStep(0);

    const fetchOptions = async () => {
      setLoadingOptions(true);
      setOptionsError(null);
      try {
        const [employeeList, years] = await Promise.all([
          fetchSalaryEmployees(),
          fetchAcademicYears(),
        ]);
        setEmployees(employeeList);
        setAcademicYears(years);
        if (employeeList.length === 0) {
          setOptionsError("No tutors or mentors found. Add staff users first.");
        }
      } catch (error) {
        console.error(error);
        setOptionsError("Could not load employees or academic years.");
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
        employeeId: initialData.employee._id,
        amount: initialData.amount,
        month: initialData.month,
        year: initialData.year,
        status: initialData.status,
        paymentDate: initialData.paymentDate
          ? new Date(initialData.paymentDate)
          : undefined,
        academicYearId: initialData.academicYear?._id ?? "",
      });
    } else {
      form.reset({
        employeeId: "",
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: "pending",
        paymentDate: undefined,
        academicYearId: "",
      });
    }
  }, [initialData, form, open]);

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit: SubmitHandler<SalaryFormValues> = async (data) => {
    const payload = {
      employeeId: data.employeeId,
      amount: data.amount,
      month: data.month,
      year: data.year,
      status: data.status,
      academicYearId: data.academicYearId,
      paymentDate:
        data.status === "paid"
          ? (data.paymentDate ?? new Date()).toISOString()
          : data.paymentDate
            ? data.paymentDate.toISOString()
            : undefined,
    };

    try {
      if (initialData) {
        await api.put(`/finance/salaries/${initialData._id}`, payload);
        toast.success("Salary record updated");
      } else {
        await api.post("/finance/salaries", payload);
        toast.success("Salary record created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  const pending = form.formState.isSubmitting;
  const watchStatus = form.watch("status");
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={financeModalContentClass}>
        <DialogHeader className={financeModalHeaderClass}>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Banknote className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {initialData ? "Edit Salary" : "Add Salary"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            Record payroll for tutors and mentors.
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
                Loading form options…
              </div>
            )}
            {optionsError && !loadingOptions && (
              <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                {optionsError}
              </p>
            )}

            <FieldGroup className={financeModalFieldStack}>
              {step === 0 && (
                <>
                  <Controller
                    name="employeeId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Employee</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingOptions || employees.length === 0}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp._id} value={emp._id}>
                                {emp.name}
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
                  <div className={financeModalGrid}>
                    <Controller
                      name="month"
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Month</FieldLabel>
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value.toString()}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (m) => (
                                  <SelectItem key={m} value={m.toString()}>
                                    {new Date(2000, m - 1, 1).toLocaleString(
                                      "default",
                                      { month: "long" },
                                    )}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />
                    <Controller
                      name="year"
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Year</FieldLabel>
                          <Input
                            type="number"
                            placeholder="2025"
                            className="h-11 rounded-xl"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </Field>
                      )}
                    />
                  </div>
                  <Controller
                    name="academicYearId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Academic Year</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingOptions || academicYears.length === 0}
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

              {step === 2 && (
                <>
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  {watchStatus === "paid" && (
                    <Controller
                      name="paymentDate"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Payment Date</FieldLabel>
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
                  )}
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
                disabled={
                  pending ||
                  loadingOptions ||
                  !!optionsError ||
                  employees.length === 0
                }
                onClick={() => void form.handleSubmit(onSubmit)()}
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Salary"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[120px]"
                onClick={() => void goNext()}
                disabled={loadingOptions || !!optionsError}
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

export default SalaryForm;
