import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import FeeTable from "@/components/finance/FeeTable";
import FeeForm from "@/components/finance/FeeForm";
import CustomAlert from "@/components/global/CustomAlert";
import type { Fee } from "@/types";
import { cn } from "@/lib/utils";

interface FeeCollectionProps {
  embedded?: boolean;
}

const FeeCollection = ({ embedded = false }: FeeCollectionProps) => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const searchParam = debouncedSearch
          ? `&search=${encodeURIComponent(debouncedSearch)}`
          : "";
        const { data } = await api.get(
          `/finance/fees?page=${page}&limit=10${searchParam}`,
        );
        if (cancelled) return;

        setFees(data.data?.fees ?? []);
        setTotalPages(data.pagination?.pages ?? 1);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load fee records:", error);
        toast.error("Failed to load fee records");
        setFees([]);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, refreshKey]);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCreate = () => {
    setEditingFee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/finance/fees/${deleteId}`);
      toast.success("Fee record deleted");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete fee record");
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
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2
                className={cn(
                  "font-bold tracking-tight text-slate-900",
                  embedded ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
                )}
              >
                Fee Collection
              </h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                Manage student fees, due dates, and payment status.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            className="h-11 w-full shrink-0 rounded-xl sm:w-auto sm:min-w-[160px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>

        <FeeTable
          fees={fees}
          loading={loading}
          onEdit={handleEdit}
          onDelete={(id) => {
            setDeleteId(id);
            setIsDeleteOpen(true);
          }}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          externalSearch={search}
          onExternalSearchChange={setSearch}
        />

        <FeeForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={editingFee}
          onSuccess={refetch}
        />

        <CustomAlert
          isOpen={isDeleteOpen}
          setIsOpen={setIsDeleteOpen}
          handleDelete={handleDelete}
          title="Delete Fee Record"
          description="This action cannot be undone. Are you sure?"
        />
      </div>
    </div>
  );
};

export default FeeCollection;
