import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Banknote, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import SalaryHeatmap from "@/components/finance/SalaryHeatmap";
import SalaryForm from "@/components/finance/SalaryForm";
import CustomAlert from "@/components/global/CustomAlert";
import type { Salary as SalaryType } from "@/types";
import { cn } from "@/lib/utils";

interface SalaryProps {
  embedded?: boolean;
}

const Salary = ({ embedded = false }: SalaryProps) => {
  const [salaries, setSalaries] = useState<SalaryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/finance/salaries?page=1&limit=200");
      setSalaries(data.data?.salaries ?? []);
    } catch (error) {
      console.error("Failed to load salary records:", error);
      toast.error("Failed to load salary records");
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSalaries();
  }, [fetchSalaries, refreshKey]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCreate = () => {
    setEditingSalary(null);
    setIsFormOpen(true);
  };

  const handleEdit = (salary: SalaryType) => {
    setEditingSalary(salary);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/finance/salaries/${deleteId}`);
      toast.success("Salary record deleted");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete salary record");
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div
      className={cn(
        "relative space-y-5 overflow-hidden sm:space-y-6",
        embedded ? "p-4 sm:p-5 md:p-6" : "p-4 sm:p-6",
      )}
    >
      {!embedded && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.03]" />
          <div className="pointer-events-none absolute top-20 left-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </>
      )}

      <div className="relative z-10 space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2
                className={cn(
                  "font-bold tracking-tight text-slate-900",
                  embedded ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
                )}
              >
                Salary Management
              </h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                Manage employee salaries and payment status.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            className="h-11 w-full shrink-0 rounded-xl sm:w-auto sm:min-w-40"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Salary
          </Button>
        </div>

        <SalaryHeatmap
          salaries={salaries}
          loading={loading}
          onEdit={handleEdit}
          onDelete={(id) => {
            setDeleteId(id);
            setIsDeleteOpen(true);
          }}
        />

        <SalaryForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={editingSalary}
          onSuccess={refetch}
        />

        <CustomAlert
          isOpen={isDeleteOpen}
          setIsOpen={setIsDeleteOpen}
          handleDelete={handleDelete}
          title="Delete Salary Record"
          description="This action cannot be undone. Are you sure?"
        />
      </div>
    </div>
  );
};

export default Salary;
