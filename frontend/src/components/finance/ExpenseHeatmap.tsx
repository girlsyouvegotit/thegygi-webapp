import { useMemo, useState } from "react";
import {
  format,
  getYear,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  Loader2,
  Pencil,
  Receipt,
  Trash2,
  TrendingDown,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types";

const CATEGORIES = [
  "salary",
  "utilities",
  "maintenance",
  "supplies",
  "other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<
  Category,
  { label: string; accent: string; glow: string }
> = {
  salary: {
    label: "Salary",
    accent: "#6366f1",
    glow: "rgba(99,102,241,0.35)",
  },
  utilities: {
    label: "Utilities",
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
  },
  maintenance: {
    label: "Maintenance",
    accent: "#f97316",
    glow: "rgba(249,115,22,0.35)",
  },
  supplies: {
    label: "Supplies",
    accent: "#c147e9",
    glow: "rgba(193,71,233,0.4)",
  },
  other: {
    label: "Other",
    accent: "#64748b",
    glow: "rgba(100,116,139,0.35)",
  },
};

interface Props {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

interface CellData {
  category: Category;
  monthKey: string;
  monthLabel: string;
  total: number;
  count: number;
  items: Expense[];
}

function intensityColor(ratio: number, accent: string): string {
  if (ratio <= 0) return "rgba(148,163,184,0.08)";
  const t = Math.min(1, Math.max(0.12, ratio));
  // Parse hex accent → rgba with intensity
  const hex = accent.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = 0.18 + t * 0.82;
  return `rgba(${r},${g},${b},${alpha})`;
}

function parseExpenseDate(date: string): Date {
  try {
    return date.includes("T") ? parseISO(date) : new Date(date);
  } catch {
    return new Date(date);
  }
}

const ExpenseHeatmap = ({
  expenses,
  loading,
  onEdit,
  onDelete,
}: Props) => {
  const [activeCell, setActiveCell] = useState<CellData | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  const months = useMemo(() => {
    const now = startOfMonth(new Date());
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, 11 - i);
      return {
        key: format(d, "yyyy-MM"),
        label: format(d, "MMM"),
        short: format(d, "MMM"),
        year: getYear(d),
      };
    });
  }, []);

  const { grid, maxCell, totals, byCategory, recent } = useMemo(() => {
    const map = new Map<string, CellData>();

    for (const cat of CATEGORIES) {
      for (const m of months) {
        map.set(`${cat}:${m.key}`, {
          category: cat,
          monthKey: m.key,
          monthLabel: m.label,
          total: 0,
          count: 0,
          items: [],
        });
      }
    }

    for (const exp of expenses) {
      const d = parseExpenseDate(exp.date);
      const key = `${format(d, "yyyy-MM")}`;
      const cat = (CATEGORIES.includes(exp.category as Category)
        ? exp.category
        : "other") as Category;
      const cellKey = `${cat}:${key}`;
      const cell = map.get(cellKey);
      if (!cell) continue;
      cell.total += exp.amount || 0;
      cell.count += 1;
      cell.items.push(exp);
    }

    let max = 0;
    for (const cell of map.values()) {
      if (cell.total > max) max = cell.total;
    }

    const categoryTotals = CATEGORIES.map((cat) => {
      let total = 0;
      let count = 0;
      for (const m of months) {
        const cell = map.get(`${cat}:${m.key}`)!;
        total += cell.total;
        count += cell.count;
      }
      return { category: cat, total, count };
    });

    const grand = categoryTotals.reduce((s, c) => s + c.total, 0);

    const recentItems = [...expenses]
      .sort(
        (a, b) =>
          parseExpenseDate(b.date).getTime() -
          parseExpenseDate(a.date).getTime(),
      )
      .slice(0, 8);

    return {
      grid: map,
      maxCell: max || 1,
      totals: { grand, count: expenses.length },
      byCategory: categoryTotals,
      recent: recentItems,
    };
  }, [expenses, months]);

  const yearSpan = useMemo(() => {
    const years = [...new Set(months.map((m) => m.year))];
    return years.length === 1
      ? String(years[0])
      : `${years[0]}–${years[years.length - 1]}`;
  }, [months]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[24px] border border-white/50 bg-white/50 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-slate-900 via-slate-800 to-[#3b0764] p-5 text-white shadow-xl shadow-primary/20 sm:col-span-2 sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
                <Zap className="h-3 w-3 text-amber-300" />
                Spending heatmap · {yearSpan}
              </div>
              <p className="text-sm text-white/60">Total outflow</p>
              <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                ₦{totals.grand.toLocaleString()}
              </p>
              <p className="mt-1.5 text-xs text-white/50">
                {totals.count} logged expense
                {totals.count === 1 ? "" : "s"} across {CATEGORIES.length}{" "}
                categories
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {byCategory
                .filter((c) => c.total > 0)
                .slice(0, 3)
                .map((c) => (
                  <div
                    key={c.category}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-white/50">
                      {CATEGORY_META[c.category].label}
                    </p>
                    <p className="font-mono text-sm font-semibold">
                      ₦{c.total.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_28px_rgba(31,38,135,0.06)] backdrop-blur-xl sm:p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <TrendingDown className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Hottest cell</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            ₦
            {Math.max(
              ...[...grid.values()].map((c) => c.total),
              0,
            ).toLocaleString()}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Peak category × month spend in this window
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/65 p-4 shadow-[0_12px_40px_rgba(31,38,135,0.08)] backdrop-blur-xl sm:p-6">
        <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-fuchsia-400/10 blur-3xl" />

        <div className="relative z-10 mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Category intensity
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Brighter cells = higher spend. Tap a cell to inspect.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0.08, 0.25, 0.45, 0.7, 1].map((t) => (
                <div
                  key={t}
                  className="h-2.5 w-5 rounded-sm"
                  style={{
                    backgroundColor: intensityColor(t, "#c147e9"),
                  }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              No expenses yet
            </p>
            <p className="max-w-xs text-xs text-slate-400">
              Add your first expense to light up the heatmap.
            </p>
          </div>
        ) : (
          <div className="relative z-10 overflow-x-auto pb-1">
            <div
              className="grid min-w-[640px] gap-1.5"
              style={{
                gridTemplateColumns: `7.5rem repeat(${months.length}, minmax(0, 1fr))`,
              }}
            >
              {/* Corner + month headers */}
              <div />
              {months.map((m) => (
                <div
                  key={m.key}
                  className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]"
                >
                  {m.short}
                </div>
              ))}

              {/* Rows */}
              {CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className="contents">
                    <div className="flex items-center gap-2 pr-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: meta.accent }}
                      />
                      <span className="truncate text-xs font-medium text-slate-600">
                        {meta.label}
                      </span>
                    </div>
                    {months.map((m) => {
                      const cell = grid.get(`${cat}:${m.key}`)!;
                      const ratio = cell.total / maxCell;
                      const id = `${cat}:${m.key}`;
                      const isHover = hoverCell === id;
                      const isActive =
                        activeCell?.category === cat &&
                        activeCell?.monthKey === m.key;

                      return (
                        <button
                          key={id}
                          type="button"
                          onMouseEnter={() => setHoverCell(id)}
                          onMouseLeave={() => setHoverCell(null)}
                          onClick={() =>
                            setActiveCell(
                              isActive && cell.total > 0 ? null : cell.total > 0 ? cell : null,
                            )
                          }
                          className={cn(
                            "group relative aspect-square min-h-[36px] rounded-xl border transition-all duration-300 sm:min-h-[44px] sm:rounded-2xl",
                            cell.total > 0
                              ? "cursor-pointer border-white/40"
                              : "cursor-default border-transparent",
                            (isHover || isActive) &&
                              cell.total > 0 &&
                              "z-10 scale-[1.06] ring-2 ring-white/80",
                          )}
                          style={{
                            backgroundColor: intensityColor(ratio, meta.accent),
                            boxShadow:
                              (isHover || isActive) && cell.total > 0
                                ? `0 8px 24px ${meta.glow}`
                                : undefined,
                          }}
                          title={
                            cell.total > 0
                              ? `${meta.label} · ${m.label}: ₦${cell.total.toLocaleString()}`
                              : undefined
                          }
                          aria-label={`${meta.label} ${m.label}`}
                        >
                          {cell.total > 0 && ratio > 0.35 && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90 opacity-0 transition group-hover:opacity-100 sm:text-[10px]">
                              {cell.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active cell detail */}
        {activeCell && activeCell.total > 0 && (
          <div
            className="relative z-10 mt-5 animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 duration-300 sm:p-5"
            style={{
              boxShadow: `inset 3px 0 0 ${CATEGORY_META[activeCell.category].accent}`,
            }}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {CATEGORY_META[activeCell.category].label} ·{" "}
                  {activeCell.monthLabel}
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">
                  ₦{activeCell.total.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  {activeCell.count} transaction
                  {activeCell.count === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs text-slate-500"
                onClick={() => setActiveCell(null)}
              >
                Close
              </Button>
            </div>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {activeCell.items.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2.5 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.description}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {format(parseExpenseDate(item.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-slate-900">
                    ₦{item.amount.toLocaleString()}
                  </span>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => onDelete(item._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Category bars + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="rounded-[22px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_28px_rgba(31,38,135,0.06)] backdrop-blur-xl lg:col-span-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Category share
          </h3>
          <div className="space-y-3.5">
            {byCategory.map((c) => {
              const meta = CATEGORY_META[c.category];
              const pct =
                totals.grand > 0
                  ? Math.round((c.total / totals.grand) * 100)
                  : 0;
              return (
                <div key={c.category}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-slate-400">
                      {pct}% · ₦{c.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: meta.accent,
                        boxShadow: pct > 0 ? `0 0 12px ${meta.glow}` : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_28px_rgba(31,38,135,0.06)] backdrop-blur-xl lg:col-span-7">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Recent expenses
          </h3>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nothing logged yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((item) => {
                const cat = (CATEGORIES.includes(item.category as Category)
                  ? item.category
                  : "other") as Category;
                const meta = CATEGORY_META[cat];
                return (
                  <li
                    key={item._id}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2.5 transition hover:border-slate-100 hover:bg-slate-50/80"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{
                        background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}cc)`,
                      }}
                    >
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {meta.label} ·{" "}
                        {format(parseExpenseDate(item.date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold text-slate-900">
                      ₦{item.amount.toLocaleString()}
                    </span>
                    <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onDelete(item._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseHeatmap;
