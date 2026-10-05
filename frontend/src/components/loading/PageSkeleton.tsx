import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { saCard, saCardTight, saMainGrid, saPageShell, saSpan4, saSpan5, saSpan7, saSpan8, saSpan12 } from "@/lib/superAdminStyles";

/** Soft pulse block used across role dashboards */
export function Skel({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("rounded-2xl bg-slate-200/70 dark:bg-slate-700/50", className)}
    />
  );
}

/** Full page skeleton for Super Admin hubs / command center */
export function SaPageSkeleton({
  titleWidth = "w-56",
}: {
  titleWidth?: string;
}) {
  return (
    <div className={saPageShell} aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <Skel className="h-3 w-28" />
        <Skel className={cn("h-9", titleWidth)} />
        <Skel className="h-4 w-full max-w-md" />
      </div>

      <div className={saMainGrid}>
        <div className={cn(saCard, saSpan4, "space-y-4 !bg-slate-800/90")}>
          <Skel className="h-3 w-24 bg-white/20" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skel className="h-10 w-1.5 bg-white/25" />
              <div className="flex-1 space-y-2">
                <Skel className="h-7 w-24 bg-white/25" />
                <Skel className="h-3 w-16 bg-white/15" />
              </div>
            </div>
          ))}
        </div>

        <div className={cn(saSpan4, "grid gap-4")}>
          <div className={cn(saCardTight, "flex items-center justify-between gap-3")}>
            <div className="flex-1 space-y-2">
              <Skel className="h-4 w-28" />
              <Skel className="h-3 w-20" />
            </div>
            <Skel className="h-20 w-20 shrink-0 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(saCardTight, "space-y-3")}>
              <Skel className="h-4 w-16" />
              <Skel className="mx-auto h-16 w-16 rounded-full" />
            </div>
            <div className={cn(saCardTight, "space-y-3")}>
              <Skel className="h-4 w-16" />
              <Skel className="mx-auto h-16 w-16 rounded-full" />
            </div>
          </div>
        </div>

        <div className={cn(saSpan4, "grid gap-4")}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn(saCardTight, "space-y-3")}>
              <div className="flex gap-2">
                <Skel className="h-5 w-14 rounded-full" />
                <Skel className="h-5 w-16 rounded-full" />
              </div>
              <Skel className="h-5 w-3/4" />
              <Skel className="h-3 w-1/2" />
            </div>
          ))}
        </div>

        <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-4", saSpan12)}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn(saCardTight, "space-y-3")}>
              <Skel className="h-3 w-20" />
              <Skel className="h-8 w-16" />
            </div>
          ))}
        </div>

        <div className={cn(saCard, saSpan7, "space-y-4")}>
          <Skel className="h-5 w-40" />
          <Skel className="h-56 w-full" />
        </div>
        <div className={cn(saCard, saSpan5, "space-y-3")}>
          <Skel className="h-5 w-32" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skel className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skel className="h-3 w-full" />
                <Skel className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compact hub skeleton (lists / forms) */
export function SaHubSkeleton() {
  return (
    <div className={saPageShell} aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <Skel className="h-3 w-28" />
        <Skel className="h-9 w-64" />
        <Skel className="h-4 w-full max-w-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn(saCardTight, "space-y-3")}>
            <Skel className="h-3 w-16" />
            <Skel className="h-7 w-14" />
          </div>
        ))}
      </div>
      <div className={saMainGrid}>
        <div className={cn(saCard, saSpan4, "space-y-3")}>
          <Skel className="h-5 w-32" />
          {[1, 2, 3, 4].map((i) => (
            <Skel key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className={cn(saCard, saSpan8, "space-y-3")}>
          <Skel className="h-5 w-40" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skel key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Writer dashboard skeleton — mirrors Journal workspace layout */
export function WriterDashboardSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1600px] px-3 pt-5 pb-8 sm:px-5 sm:pt-6 lg:px-7"
      aria-busy="true"
      aria-label="Loading writer dashboard"
    >
      <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="space-y-2">
          <Skel className="h-3 w-28" />
          <Skel className="h-9 w-56 sm:w-72" />
        </div>
        <div className="grid w-full grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:w-auto">
          <Skel className="h-11 w-full sm:w-36" />
          <Skel className="h-11 w-full sm:w-32" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="space-y-4 rounded-[1.35rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <Skel className="h-6 w-24 rounded-full" />
                  <Skel className="h-3 w-16" />
                </div>
                <Skel className="h-14 w-28" />
                <Skel className="h-4 w-full" />
                <Skel className="h-4 w-3/4" />
                <Skel className="h-3 w-40" />
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-[1.35rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Skel className="h-5 w-40" />
                <Skel className="h-3 w-48" />
              </div>
              <Skel className="h-9 w-24" />
            </div>
            <Skel className="h-56 w-full" />
          </div>

          <div className="space-y-3 rounded-[1.35rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-2 flex items-center justify-between">
              <Skel className="h-5 w-36" />
              <Skel className="h-4 w-16" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-3 border-t border-slate-100 py-3.5 first:border-t-0 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skel className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skel className="h-4 w-3/4" />
                    <Skel className="h-3 w-1/2" />
                  </div>
                </div>
                <Skel className="h-2 w-full sm:w-44" />
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="space-y-2 rounded-[1.35rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
            <Skel className="mb-2 h-4 w-24" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-1 py-2">
                <Skel className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skel className="h-3.5 w-2/3" />
                  <Skel className="h-3 w-1/2" />
                </div>
                <Skel className="h-3 w-10" />
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-[1.35rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
            <Skel className="h-4 w-28" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-2xl border border-slate-100 bg-[#FAFAFC] p-3"
                >
                  <Skel className="h-1 w-8" />
                  <Skel className="h-3.5 w-3.5" />
                  <Skel className="h-6 w-10" />
                  <Skel className="h-3 w-14" />
                </div>
              ))}
            </div>
            <Skel className="h-14 w-full rounded-2xl" />
          </div>

          <div className="space-y-3 rounded-[1.35rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-1 flex items-center justify-between">
              <Skel className="h-4 w-24" />
              <Skel className="h-3.5 w-3.5" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="space-y-2 rounded-2xl border border-slate-100 bg-[#FAFAFC] p-3"
              >
                <Skel className="h-4 w-3/4" />
                <Skel className="h-3 w-full" />
                <Skel className="h-3 w-2/3" />
                <div className="flex justify-between pt-1">
                  <Skel className="h-3 w-12" />
                  <Skel className="h-6 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Writer posts list skeleton */
export function WriterListSkeleton() {
  return (
    <div
      className="divide-y divide-slate-100"
      aria-busy="true"
      aria-label="Loading posts"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skel className="h-4 w-3/4" />
            <Skel className="h-3 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skel className="h-9 w-9 rounded-full" />
            <Skel className="h-9 w-9 rounded-full" />
            <Skel className="h-9 w-9 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Writer editor / about form skeleton */
export function WriterFormSkeleton() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8"
      aria-busy="true"
      aria-label="Loading editor"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skel className="h-9 w-48" />
          <Skel className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-10 w-24 rounded-full" />
          <Skel className="h-10 w-28 rounded-full" />
        </div>
      </div>
      <div className="space-y-4 rounded-[1.5rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <Skel className="h-11 w-full rounded-xl" />
        <Skel className="h-11 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skel className="h-11 w-full rounded-xl" />
          <Skel className="h-11 w-full rounded-xl" />
        </div>
        <Skel className="h-40 w-full rounded-xl" />
        <Skel className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Student/tutor list pages — header + search + card grid */
export function PageListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skel className="h-8 w-48 sm:w-64" />
          <Skel className="h-4 w-72 max-w-full" />
        </div>
        <Skel className="h-10 w-full rounded-full sm:w-40" />
      </div>
      <Skel className="h-11 w-full max-w-md rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Skel className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skel className="h-4 w-3/4" />
                <Skel className="h-3 w-1/2" />
              </div>
            </div>
            <Skel className="h-3 w-full" />
            <Skel className="h-3 w-2/3" />
            <Skel className="h-2 w-full" />
            <div className="flex justify-between pt-1">
              <Skel className="h-5 w-16 rounded-full" />
              <Skel className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin/finance style — KPIs + table rows */
export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <Skel className="h-8 w-56" />
        <Skel className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <Skel className="h-3 w-20" />
            <Skel className="h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex gap-3">
          <Skel className="h-10 flex-1 rounded-xl" />
          <Skel className="h-10 w-28 rounded-xl" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-slate-50 py-3">
            <Skel className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skel className="h-3.5 w-2/3" />
              <Skel className="h-3 w-1/3" />
            </div>
            <Skel className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Community / chat two-pane skeleton */
export function ChatPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading community"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skel className="h-7 w-40" />
          <Skel className="h-3 w-56" />
        </div>
        <Skel className="h-9 w-28 rounded-full" />
      </div>
      <div className="grid h-[min(78vh,720px)] grid-cols-1 gap-3 md:grid-cols-12">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white md:col-span-4 lg:col-span-3">
          <div className="space-y-3 border-b px-4 py-4 sm:px-5 sm:py-5">
            <Skel className="h-12 w-full rounded-2xl" />
          </div>
          <div className="flex-1 space-y-2 p-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skel key={i} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white md:col-span-8 lg:col-span-9">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Skel className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skel className="h-4 w-32" />
              <Skel className="h-3 w-20" />
            </div>
          </div>
          <div className="flex-1 space-y-4 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  i % 2 === 0 ? "flex-row-reverse" : "",
                )}
              >
                <Skel className="h-8 w-8 shrink-0 rounded-full" />
                <Skel
                  className={cn(
                    "h-16 rounded-2xl",
                    i % 2 === 0 ? "w-[55%]" : "w-[45%]",
                  )}
                />
              </div>
            ))}
          </div>
          <div className="border-t p-3">
            <Skel className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Profile cover + form skeleton */
export function ProfilePageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <Skel className="h-36 w-full rounded-3xl sm:h-44" />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="-mt-14 flex items-end gap-4">
            <Skel className="h-24 w-24 shrink-0 rounded-full ring-4 ring-white" />
            <div className="mb-2 flex-1 space-y-2">
              <Skel className="h-6 w-40" />
              <Skel className="h-3 w-28" />
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skel className="h-3 w-20" />
              <Skel className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <Skel className="h-5 w-28" />
            <Skel className="h-16 w-full" />
            <div className="flex flex-wrap gap-2">
              <Skel className="h-7 w-20 rounded-full" />
              <Skel className="h-7 w-24 rounded-full" />
            </div>
          </div>
          <Skel className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

/** Compact section / detail skeleton */
export function SimpleSectionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skel className="h-8 w-48" />
      <Skel className="h-4 w-72 max-w-full" />
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        {Array.from({ length: rows }, (_, i) => (
          <Skel key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Generic role dashboard skeleton (student / tutor / admin / mentor) */
export function RoleDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-3">
        <Skel className="h-8 w-48 sm:w-72" />
        <Skel className="h-4 w-full max-w-md" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <Skel className="h-3 w-20" />
            <Skel className="h-8 w-16" />
            <Skel className="h-2 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <Skel className="h-5 w-40" />
          <Skel className="h-48 w-full sm:h-56" />
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <Skel className="h-5 w-32" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <Skel className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skel className="h-3 w-full" />
                <Skel className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <Skel className="h-5 w-36" />
            {[1, 2, 3].map((j) => (
              <Skel key={j} className="h-14 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
