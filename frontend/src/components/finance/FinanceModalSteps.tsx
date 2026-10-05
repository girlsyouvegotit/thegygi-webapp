import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface FinanceModalStepsProps {
  steps: string[];
  current: number;
}

export function FinanceModalSteps({ steps, current }: FinanceModalStepsProps) {
  return (
    <div className="mt-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">
          Step {current + 1} of {steps.length}
          <span className="text-slate-300"> · </span>
          <span className="text-slate-700">{steps[current]}</span>
        </p>
        <p className="tabular-nums text-[11px] font-medium text-slate-400">
          {Math.round(((current + 1) / steps.length) * 100)}%
        </p>
      </div>
      <div className="flex gap-1.5">
        {steps.map((label, i) => (
          <div
            key={label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < current
                ? "bg-primary/50"
                : i === current
                  ? "bg-primary"
                  : "bg-slate-200",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

export const financeModalFooterNavClass =
  "shrink-0 flex-col-reverse gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5";

/** Block accidental Enter/native submit; advance step instead of saving early. */
export function guardSteppedFormKeyDown(
  e: KeyboardEvent,
  opts: { isLast: boolean; onNext: () => void },
) {
  if (e.key !== "Enter") return;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === "TEXTAREA") return;
  e.preventDefault();
  if (!opts.isLast) opts.onNext();
}
