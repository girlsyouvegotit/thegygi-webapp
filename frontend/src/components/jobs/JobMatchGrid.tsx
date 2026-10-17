import { useRef } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import JobMatchCard, { type JobMatchCardJob } from "./JobMatchCard";

type Props = {
  jobs: JobMatchCardJob[];
  loading?: boolean;
  stackSize?: number;
  pageSize?: number;
  collapsedCount?: number;
  emptyMessage?: string;
  className?: string;
};

export default function JobMatchGrid({
  jobs,
  loading,
  emptyMessage = "No jobs matched right now",
  className,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);

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
        "relative space-y-4 overflow-hidden rounded-[2rem] p-4 sm:p-6",
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

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500">
          <span className="font-black text-[#2D2D44]">{jobs.length}</span>{" "}
          matches
        </p>
        {jobs.length > 1 ? (
          <button
            type="button"
            onClick={() =>
              scroller.current?.scrollBy({ left: 320, behavior: "smooth" })
            }
            className="inline-flex items-center gap-1 text-[11px] font-black tracking-wide text-[#9b2ec4] uppercase"
          >
            Swipe
            <ChevronRight className="h-4 w-4 animate-pulse" />
          </button>
        ) : null}
      </div>

      <div
        ref={scroller}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {jobs.map((job) => (
          <div
            key={job.id}
            className="w-[min(100%,22rem)] shrink-0 snap-center"
          >
            <JobMatchCard job={job} stacked={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
