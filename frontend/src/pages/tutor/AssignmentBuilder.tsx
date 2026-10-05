import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { format, isPast } from "date-fns";
import {
  FileText,
  Plus,
  Calendar,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import AssignmentBuilderComponent from "@/components/assignments/AssignmentBuilder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/global/EmptyState";
import type { assignment } from "@/types";
import { cn } from "@/lib/utils";

const AssignmentBuilder = () => {
  const navigate = useNavigate();
  const createSectionRef = useRef<HTMLElement>(null);
  const [assignments, setAssignments] = useState<assignment[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await api.get("/assignments");
      setAssignments(data.data.assignments as assignment[]);
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const scrollToCreate = () => {
    createSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSuccess = () => {
    void fetchAssignments();
  };

  const upcomingCount = assignments.filter(
    (a) => !isPast(new Date(a.dueDate)),
  ).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-40 h-52 w-52 rounded-full bg-fuchsia-200/20 blur-3xl" />
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Coursework
            </p>
            <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">
              Assignments
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Manage assignments and create new work for students
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!listLoading && assignments.length > 0 && (
            <Badge className="border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              {upcomingCount} upcoming
            </Badge>
          )}
          <Button
            className="h-10 gap-2 rounded-xl bg-primary shadow-md shadow-primary/25 hover:bg-primary/90"
            onClick={scrollToCreate}
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Your assignments</h2>
            <p className="text-xs text-slate-500">
              Open an assignment to view details or grade submissions
            </p>
          </div>
          {!listLoading && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              {assignments.length} total
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="Create your first assignment using the form below"
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              actionLabel="Create Assignment"
              onAction={scrollToCreate}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {assignments.map((item) => {
                const overdue = isPast(new Date(item.dueDate));
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() =>
                      navigate(`/tutor/assignments/${item._id}`)
                    }
                    className={cn(
                      "group flex w-full flex-col gap-3 rounded-2xl border border-slate-200/70 bg-[#FAFAFC] p-4 text-left",
                      "transition-all duration-200 hover:border-primary/25 hover:bg-primary/3 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-semibold text-slate-900 group-hover:text-primary">
                        {item.title}
                      </p>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.category?.name && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          {item.category.name}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                          overdue
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-emerald-500/10 text-emerald-600",
                        )}
                      >
                        {overdue ? "Past due" : "Active"}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-primary/70" />
                      Due {format(new Date(item.dueDate), "MMM d, yyyy · h:mm a")}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        ref={createSectionRef}
        id="create-assignment"
        className="scroll-mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Create assignment
            </h2>
            <p className="text-xs text-slate-500">
              Fill in the assignment information for your students
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">

            New
          </span>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <AssignmentBuilderComponent
            onSuccess={handleSuccess}
            onCancel={() => navigate("/tutor/assignments")}
          />
        </div>
      </section>
    </div>
  );
};

export default AssignmentBuilder;
