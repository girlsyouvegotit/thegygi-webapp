import { cn } from "@/lib/utils";

/** Shared DialogContent shell for finance forms — mobile-first with breathing room. */
export const financeModalContentClass = cn(
  "flex max-h-[min(92dvh,calc(100svh-1rem))] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0",
  "rounded-[1.25rem] sm:rounded-2xl sm:max-w-lg",
  "border border-white/60 bg-white shadow-[0_20px_60px_rgba(31,38,135,0.18)]",
);

export const financeModalHeaderClass =
  "shrink-0 space-y-1.5 border-b border-slate-100 px-5 pb-4 pt-5 text-left sm:px-7 sm:pb-5 sm:pt-6";

export const financeModalBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6";

export const financeModalFooterClass =
  "shrink-0 flex-col gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-7 sm:py-5";

export const financeModalFieldStack = "space-y-5";

export const financeModalGrid = "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4";
