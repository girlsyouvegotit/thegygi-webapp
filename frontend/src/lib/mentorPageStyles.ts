import { cn } from "@/lib/utils";

/** Page shell for mentor workspace pages */
export const mentorPageShell =
  "mx-auto w-full max-w-[1200px] space-y-5 px-3 pb-8 pt-3 sm:space-y-6 sm:px-5 sm:pb-10 sm:pt-4 lg:px-8";

export const mentorPageHeader =
  "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4";

export const mentorPageTitle =
  "text-2xl font-black tracking-tight text-slate-900 sm:text-3xl";

export const mentorPageSubtitle =
  "mt-1 text-sm text-muted-foreground sm:text-[15px]";

export const mentorPageAction =
  "h-10 w-full shrink-0 rounded-xl sm:h-10 sm:w-auto";

/** Dialog shell for mentor create/edit modals — scrolls on short viewports */
export const mentorModalContentClass = cn(
  "flex max-h-[min(92dvh,calc(100svh-1rem))] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0",
  "rounded-2xl sm:max-w-lg",
  "border border-slate-200 bg-white shadow-xl",
);

export const mentorModalHeaderClass =
  "shrink-0 space-y-1 border-b border-slate-100 px-4 pb-3 pt-4 text-left sm:px-6 sm:pb-4 sm:pt-5";

export const mentorModalBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5";

export const mentorModalFooterClass =
  "shrink-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4";

export const mentorFormGrid =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4";
