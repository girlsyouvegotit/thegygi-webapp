import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Airy budget-dashboard shell — GYGI magenta accent */
export const saPageShell =
  "mx-auto w-full max-w-[1600px] space-y-7 px-4 pb-14 pt-5 sm:px-6 lg:px-8";

export const saCard =
  "rounded-[28px] border border-border bg-card p-5 shadow-[0_10px_40px_rgba(45,45,68,0.07)] sm:p-6 lg:p-8 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]";

export const saCardTight =
  "rounded-[24px] border border-border bg-card p-5 shadow-[0_8px_28px_rgba(45,45,68,0.06)] sm:p-6 dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)]";

export const saTitle =
  "text-[1.65rem] font-black tracking-tight text-foreground sm:text-[1.85rem] lg:text-[2rem]";

export const saSubtitle =
  "mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]";

export const saPrimaryBtn =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_rgba(193,71,233,0.32)] transition hover:bg-primary/90 disabled:opacity-60";

export const saPill =
  "inline-flex h-9 items-center rounded-full px-3.5 text-[11px] font-bold transition";

export const saInput =
  "h-11 w-full rounded-2xl border border-border bg-muted px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

/**
 * 12-col packing without orphan right cells.
 * - saSpan4 stacks until xl (3-up only when wide enough — avoids cramped tablet cols)
 * - saSpan6 pairs from lg
 * - saSpan5/7/8 stack until xl
 * - Lone saSpan8 blocks should add `xl:col-span-12`
 */
export const saMainGrid =
  "grid grid-cols-1 items-stretch gap-6 md:grid-cols-12 md:gap-6 xl:gap-7";

export const saSpan4 = "md:col-span-12 xl:col-span-4";
export const saSpan5 = "md:col-span-12 xl:col-span-5";
export const saSpan6 = "md:col-span-12 lg:col-span-6";
export const saSpan7 = "md:col-span-12 xl:col-span-7";
export const saSpan8 = "md:col-span-12 xl:col-span-8";
export const saSpan12 = "md:col-span-12";

export function healthTone(status?: string) {
  if (status === "green")
    return {
      chip: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
      dot: "bg-emerald-500",
      label: "Operational",
      card: "bg-gradient-to-br from-[#5B5FEF] via-[#7C78E0] to-[#c147e9]",
    };
  if (status === "amber")
    return {
      chip: "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-300",
      dot: "bg-amber-500",
      label: "Degraded",
      card: "bg-gradient-to-br from-[#FF9F43] via-[#f59e0b] to-[#fb923c]",
    };
  return {
    chip: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
    dot: "bg-rose-500",
    label: "Critical",
    card: "bg-gradient-to-br from-[#e11d48] via-[#f43f5e] to-[#fb7185]",
  };
}

export function money(n?: number) {
  return `₦${Math.round(n || 0).toLocaleString()}`;
}

export function StatPill({
  label,
  value,
  hint,
  className,
  valueClassName,
  nairaBg,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  valueClassName?: string;
  /** Large ₦ watermark for fee/money cards */
  nairaBg?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl bg-muted px-4 py-4 ring-1 ring-border sm:px-5 sm:py-5",
        className,
      )}
    >
      {nairaBg ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 -bottom-5 select-none text-[5.5rem] font-black leading-none text-primary/15 sm:text-[6.5rem]"
        >
          ₦
        </span>
      ) : null}
      <div className="relative z-10">
        <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p
          className={cn(
            "mt-1.5 break-words text-xl font-black tabular-nums text-foreground sm:text-2xl",
            valueClassName,
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SaSoftButton({
  children,
  className,
  tone = "neutral",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "neutral" | "primary" | "warn" | "danger" | "success" | "orange";
}) {
  const tones = {
    neutral:
      "bg-muted text-foreground hover:bg-muted/80",
    primary:
      "bg-primary/15 text-primary hover:bg-primary/20",
    warn: "bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:text-amber-300",
    danger: "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:text-rose-300",
    success:
      "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300",
    orange:
      "bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:text-orange-300",
  };
  return (
    <button type="button" className={cn(saPill, tones[tone], className)} {...props}>
      {children}
    </button>
  );
}

export function SaPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={saTitle}>{title}</h1>
        {subtitle ? <p className={saSubtitle}>{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function SaDarkPanel({
  title,
  rows,
  className,
}: {
  title: string;
  rows: Array<{ label: string; value: string | number; color: string }>;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-[28px] bg-[#2D2D44] p-6 text-white shadow-[0_16px_40px_rgba(45,45,68,0.25)] sm:p-7 dark:bg-card dark:ring-1 dark:ring-border",
        className,
      )}
    >
      <h2 className="text-sm font-bold text-white/70 dark:text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-5 space-y-5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-start gap-3.5">
            <span
              className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
              style={{ background: r.color }}
            />
            <div className="min-w-0">
              <p className="text-2xl font-black tabular-nums tracking-tight text-white sm:text-[1.65rem] dark:text-foreground">
                {r.value}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-white/55 dark:text-muted-foreground">
                {r.label}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SaRingCard({
  title,
  subtitle,
  percent,
  tone = "primary",
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  percent: number;
  tone?: "primary" | "blue" | "orange" | "green";
  footer?: ReactNode;
  className?: string;
}) {
  const colors = {
    primary: "#c147e9",
    blue: "#5B5FEF",
    orange: "#FF9F43",
    green: "#22c55e",
  };
  const c = colors[tone];
  const p = Math.max(0, Math.min(100, percent));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (p / 100) * circ;

  return (
    <div className={cn(saCardTight, "@container h-full", className)}>
      <div className="flex flex-col items-start gap-4 @[300px]:flex-row @[300px]:items-center @[300px]:justify-between">
        <div className="min-w-0 w-full flex-1 @[300px]:pr-1">
          <p className="font-bold leading-snug text-foreground">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          className="h-20 w-20 shrink-0 -rotate-90 @[300px]:h-[88px] @[300px]:w-[88px]"
        >
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            className="stroke-muted"
            strokeWidth="8"
          />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={c}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
          <text
            x="44"
            y="44"
            textAnchor="middle"
            dominantBaseline="central"
            className="rotate-90 fill-foreground text-[13px] font-black"
            style={{ transformOrigin: "44px 44px", transform: "rotate(90deg)" }}
          >
            {Math.round(p)}%
          </text>
        </svg>
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

export function SaEntityCard({
  title,
  tags,
  meta,
  actions,
  children,
  className,
}: {
  title: string;
  tags?: Array<{ label: string; tone?: string }>;
  meta?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(saCardTight, "flex min-h-[148px] flex-col", className)}
    >
      {tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.label}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold",
                t.tone || "bg-muted text-muted-foreground",
              )}
            >
              {t.label}
            </span>
          ))}
        </div>
      ) : null}
      <h3
        className={cn(
          "text-lg font-black leading-snug text-foreground",
          tags?.length ? "mt-3" : null,
        )}
      >
        {title}
      </h3>
      {meta ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {meta}
        </p>
      ) : null}
      {children ? <div className="mt-4 min-w-0">{children}</div> : null}
      {actions ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
