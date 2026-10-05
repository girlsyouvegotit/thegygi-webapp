import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import JobMatchCard, { type JobMatchCardJob } from "./JobMatchCard";

type Props = {
  jobs: JobMatchCardJob[];
  loading?: boolean;
  /** Jobs per stacked carousel */
  stackSize?: number;
  /** Carousels per page when expanded / on desktop */
  pageSize?: number;
  /** Carousels shown when collapsed on mobile */
  collapsedCount?: number;
  emptyMessage?: string;
  className?: string;
};

function chunkJobs(jobs: JobMatchCardJob[], size: number) {
  const stacks: JobMatchCardJob[][] = [];
  for (let i = 0; i < jobs.length; i += size) {
    stacks.push(jobs.slice(i, i + size));
  }
  return stacks;
}

export default function JobMatchGrid({
  jobs,
  loading,
  stackSize = 5,
  pageSize = 2,
  collapsedCount = 1,
  emptyMessage = "No jobs matched right now",
  className,
}: Props) {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const stacks = useMemo(
    () => chunkJobs(jobs, Math.max(1, stackSize)),
    [jobs, stackSize],
  );

  const totalPages = Math.max(1, Math.ceil(stacks.length / pageSize));

  useEffect(() => {
    setPage(0);
    setExpanded(false);
  }, [jobs, stackSize, pageSize]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const pageStacks = useMemo(() => {
    const start = page * pageSize;
    return stacks.slice(start, start + pageSize);
  }, [stacks, page, pageSize]);

  const canToggle = pageStacks.length > collapsedCount;
  const pageJobCount = pageStacks.reduce((n, s) => n + s.length, 0);
  const collapsedJobCount = pageStacks
    .slice(0, collapsedCount)
    .reduce((n, s) => n + s.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading job matches…
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-primary/20 bg-white/50 py-14 text-center text-sm text-slate-400 backdrop-blur-md">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative space-y-6 overflow-hidden rounded-[2rem] p-4 sm:p-6",
        "border border-white/50 bg-gradient-to-b from-[#F7F5FB] via-[#F3E8FF]/50 to-[#F7F6FB]",
        "shadow-[0_16px_48px_rgba(193,71,233,0.08)] ring-1 ring-[#c147e9]/10",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/4 h-48 w-48 rounded-full bg-[#c147e9]/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 right-1/4 h-40 w-40 rounded-full bg-[#5B5FEF]/12 blur-3xl"
      />

      <div className="relative grid grid-cols-1 gap-10 overflow-visible lg:grid-cols-2 lg:gap-12">
        {pageStacks.map((stack, i) => (
          <div
            key={stack.map((j) => j.id).join("-") || String(i)}
            className={cn(
              "min-w-0 overflow-visible",
              !expanded && i >= collapsedCount && "hidden lg:block",
            )}
          >
            <JobMatchCard jobs={stack} stacked />
          </div>
        ))}
      </div>

      {canToggle ? (
        <div className="relative flex justify-center lg:hidden">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-10 items-center rounded-full border border-white/60 bg-white/60 px-5 text-xs font-bold text-[#2D2D44] shadow-sm backdrop-blur-md transition hover:bg-white/90 ring-1 ring-primary/15"
          >
            {expanded ? "See less" : "See all"}
          </button>
        </div>
      ) : null}

      <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/60 bg-white/50 px-4 py-3.5 shadow-sm ring-1 ring-primary/10 backdrop-blur-xl">
        <p className="text-xs font-semibold text-slate-500">
          <span className="lg:hidden">
            Showing{" "}
            <span className="font-black text-[#2D2D44]">
              {expanded ? pageJobCount : collapsedJobCount}
            </span>{" "}
            of{" "}
            <span className="font-black text-[#2D2D44]">{jobs.length}</span>{" "}
            matches
          </span>
          <span className="hidden lg:inline">
            Showing{" "}
            <span className="font-black text-[#2D2D44]">{pageJobCount}</span>{" "}
            of{" "}
            <span className="font-black text-[#2D2D44]">{jobs.length}</span>{" "}
            matches · page {page + 1}/{totalPages}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => {
              setPage((p) => Math.max(0, p - 1));
              setExpanded(false);
            }}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-xs font-bold transition",
              page <= 0
                ? "cursor-not-allowed bg-white/40 text-slate-300"
                : "bg-gradient-to-r from-[#2D2D44] to-[#4c1d6d] text-white shadow-sm hover:brightness-110",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <div className="flex items-center gap-1">
            {(() => {
              const windowSize = Math.min(5, totalPages);
              const start = Math.max(
                0,
                Math.min(page - 2, totalPages - windowSize),
              );
              return Array.from({ length: windowSize }, (_, idx) => {
                const i = start + idx;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPage(i);
                      setExpanded(false);
                    }}
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold transition",
                      page === i
                        ? "bg-gradient-to-r from-[#c147e9] to-[#5B5FEF] text-white shadow-md shadow-primary/25"
                        : "border border-white/50 bg-white/50 text-slate-500 backdrop-blur-sm hover:bg-white/80",
                    )}
                    aria-label={`Page ${i + 1}`}
                    aria-current={page === i ? "page" : undefined}
                  >
                    {i + 1}
                  </button>
                );
              });
            })()}
          </div>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => {
              setPage((p) => Math.min(totalPages - 1, p + 1));
              setExpanded(false);
            }}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-xs font-bold transition",
              page >= totalPages - 1
                ? "cursor-not-allowed bg-white/40 text-slate-300"
                : "bg-gradient-to-r from-[#2D2D44] to-[#4c1d6d] text-white shadow-sm hover:brightness-110",
            )}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
