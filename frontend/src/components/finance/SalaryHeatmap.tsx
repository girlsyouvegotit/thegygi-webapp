import { useMemo, useState } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import {
  Banknote,
  CheckCircle,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  Users,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Salary } from "@/types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const EMPLOYEE_PALETTE = [
  { accent: "#c147e9", glow: "rgba(193,71,233,0.4)" },
  { accent: "#6366f1", glow: "rgba(99,102,241,0.35)" },
  { accent: "#0ea5e9", glow: "rgba(14,165,233,0.35)" },
  { accent: "#10b981", glow: "rgba(16,185,129,0.35)" },
  { accent: "#f59e0b", glow: "rgba(245,158,11,0.35)" },
  { accent: "#f43f5e", glow: "rgba(244,63,94,0.35)" },
  { accent: "#8b5cf6", glow: "rgba(139,92,246,0.35)" },
  { accent: "#14b8a6", glow: "rgba(20,184,166,0.35)" },
];

interface Props {
  salaries: Salary[];
  loading: boolean;
  onEdit: (salary: Salary) => void;
  onDelete: (id: string) => void;
}

interface CellData {
  employeeId: string;
  employeeName: string;
  monthKey: string;
  monthLabel: string;
  total: number;
  paid: number;
  pending: number;
  count: number;
  items: Salary[];
}

function intensityColor(ratio: number, accent: string, pendingHeavy: boolean) {
  if (ratio <= 0) return "rgba(148,163,184,0.08)";
  const hex = (pendingHeavy ? "#f59e0b" : accent).replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const t = Math.min(1, Math.max(0.14, ratio));
  const alpha = 0.2 + t * 0.8;
  return `rgba(${r},${g},${b},${alpha})`;
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * 17) % 997;
  return EMPLOYEE_PALETTE[hash % EMPLOYEE_PALETTE.length];
}

const SalaryHeatmap = ({ salaries, loading, onEdit, onDelete }: Props) => {
  const [activeCell, setActiveCell] = useState<CellData | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  const months = useMemo(() => {
    const now = startOfMonth(new Date());
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, 11 - i);
      return {
        key: format(d, "yyyy-MM"),
        label: format(d, "MMM"),
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      };
    });
  }, []);

  const { employees, grid, maxCell, totals, recent } = useMemo(() => {
    const employeeMap = new Map<
      string,
      { id: string; name: string; email: string; total: number }
    >();

    for (const s of salaries) {
      const id = s.employee?._id || "unknown";
      const existing = employeeMap.get(id);
      if (existing) {
        existing.total += s.amount || 0;
      } else {
        employeeMap.set(id, {
          id,
          name: s.employee?.name || "Unknown",
          email: s.employee?.email || "",
          total: s.amount || 0,
        });
      }
    }

    const employeeList = [...employeeMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const map = new Map<string, CellData>();
    for (const emp of employeeList) {
      for (const m of months) {
        map.set(`${emp.id}:${m.key}`, {
          employeeId: emp.id,
          employeeName: emp.name,
          monthKey: m.key,
          monthLabel: m.label,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
          items: [],
        });
      }
    }

    for (const s of salaries) {
      const empId = s.employee?._id || "unknown";
      const key = `${s.year}-${String(s.month).padStart(2, "0")}`;
      const cell = map.get(`${empId}:${key}`);
      if (!cell) continue;
      cell.total += s.amount || 0;
      cell.count += 1;
      cell.items.push(s);
      if (s.status === "paid") cell.paid += s.amount || 0;
      else cell.pending += s.amount || 0;
    }

    let max = 0;
    for (const cell of map.values()) {
      if (cell.total > max) max = cell.total;
    }

    const paidTotal = salaries
      .filter((s) => s.status === "paid")
      .reduce((sum, s) => sum + (s.amount || 0), 0);
    const pendingTotal = salaries
      .filter((s) => s.status === "pending")
      .reduce((sum, s) => sum + (s.amount || 0), 0);
    const grand = paidTotal + pendingTotal;

    const recentItems = [...salaries]
      .sort((a, b) => {
        const aT = a.year * 12 + a.month;
        const bT = b.year * 12 + b.month;
        return bT - aT;
      })
      .slice(0, 8);

    return {
      employees: employeeList,
      grid: map,
      maxCell: max || 1,
      totals: {
        grand,
        paid: paidTotal,
        pending: pendingTotal,
        count: salaries.length,
        staff: employeeList.length,
      },
      recent: recentItems,
    };
  }, [salaries, months]);

  const yearSpan = useMemo(() => {
    const years = [...new Set(months.map((m) => m.year))];
    return years.length === 1
      ? String(years[0])
      : `${years[0]}–${years[years.length - 1]}`;
  }, [months]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-white/50 bg-white/50 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hero */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1e1033] via-[#3b0764] to-primary p-5 text-white shadow-xl shadow-primary/25 sm:col-span-2 sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-28 w-56 rounded-full bg-indigo-400/20 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
                <Zap className="h-3 w-3 text-amber-300" />
                Payroll heatmap · {yearSpan}
              </div>
              <p className="text-sm text-white/60">Total payroll</p>
              <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                ₦{totals.grand.toLocaleString()}
              </p>
              <p className="mt-1.5 text-xs text-white/50">
                {totals.staff} employee{totals.staff === 1 ? "" : "s"} ·{" "}
                {totals.count} salary record{totals.count === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-2xl border border-white/10 bg-emerald-400/10 px-3 py-2 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wide text-emerald-200/80">
                  Paid
                </p>
                <p className="font-mono text-sm font-semibold text-emerald-100">
                  ₦{totals.paid.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-amber-400/10 px-3 py-2 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wide text-amber-200/80">
                  Pending
                </p>
                <p className="font-mono text-sm font-semibold text-amber-100">
                  ₦{totals.pending.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_28px_rgba(31,38,135,0.06)] backdrop-blur-xl sm:p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Payment health</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totals.grand > 0
              ? Math.round((totals.paid / totals.grand) * 100)
              : 0}
            %
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Share of payroll marked paid in this window
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/65 p-4 shadow-[0_12px_40px_rgba(31,38,135,0.08)] backdrop-blur-xl sm:p-6">
        <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative z-10 mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Employee × month
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Brighter = higher pay. Amber tint = more pending. Tap to inspect.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" /> Paid-heavy
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/80" /> Pending-heavy
            </span>
            <div className="flex items-center gap-2">
              <span>Low</span>
              <div className="flex gap-0.5">
                {[0.08, 0.25, 0.45, 0.7, 1].map((t) => (
                  <div
                    key={t}
                    className="h-2.5 w-5 rounded-sm"
                    style={{
                      backgroundColor: intensityColor(t, "#c147e9", false),
                    }}
                  />
                ))}
              </div>
              <span>High</span>
            </div>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Banknote className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              No salary records yet
            </p>
            <p className="max-w-xs text-xs text-slate-400">
              Add payroll entries to light up the employee heatmap.
            </p>
          </div>
        ) : (
          <div className="relative z-10 overflow-x-auto pb-1">
            <div
              className="grid min-w-160 gap-1.5"
              style={{
                gridTemplateColumns: `10rem repeat(${months.length}, minmax(0, 1fr))`,
              }}
            >
              <div />
              {months.map((m) => (
                <div
                  key={m.key}
                  className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]"
                >
                  {m.label}
                </div>
              ))}

              {employees.map((emp) => {
                const palette = colorForId(emp.id);
                return (
                  <div key={emp.id} className="contents">
                    <div className="flex min-w-0 items-center gap-2 pr-2">
                      <Avatar className="h-7 w-7 shrink-0 border border-white shadow-sm">
                        <AvatarFallback
                          className="text-[9px] font-bold text-white"
                          style={{ backgroundColor: palette.accent }}
                        >
                          {initials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-medium text-slate-600">
                        {emp.name.split(" ")[0]}
                      </span>
                    </div>
                    {months.map((m) => {
                      const cell = grid.get(`${emp.id}:${m.key}`)!;
                      const ratio = cell.total / maxCell;
                      const id = `${emp.id}:${m.key}`;
                      const pendingHeavy =
                        cell.pending > 0 && cell.pending >= cell.paid;
                      const isHover = hoverCell === id;
                      const isActive =
                        activeCell?.employeeId === emp.id &&
                        activeCell?.monthKey === m.key;

                      return (
                        <button
                          key={id}
                          type="button"
                          onMouseEnter={() => setHoverCell(id)}
                          onMouseLeave={() => setHoverCell(null)}
                          onClick={() =>
                            setActiveCell(
                              isActive || cell.total <= 0 ? null : cell,
                            )
                          }
                          className={cn(
                            "group relative aspect-square min-h-9 rounded-xl border transition-all duration-300 sm:min-h-11 sm:rounded-2xl",
                            cell.total > 0
                              ? "cursor-pointer border-white/40"
                              : "cursor-default border-transparent",
                            (isHover || isActive) &&
                              cell.total > 0 &&
                              "z-10 scale-[1.06] ring-2 ring-white/80",
                          )}
                          style={{
                            backgroundColor: intensityColor(
                              ratio,
                              palette.accent,
                              pendingHeavy,
                            ),
                            boxShadow:
                              (isHover || isActive) && cell.total > 0
                                ? `0 8px 24px ${pendingHeavy ? "rgba(245,158,11,0.35)" : palette.glow}`
                                : undefined,
                          }}
                          title={
                            cell.total > 0
                              ? `${emp.name} · ${m.label}: ₦${cell.total.toLocaleString()}`
                              : undefined
                          }
                          aria-label={`${emp.name} ${m.label}`}
                        >
                          {cell.total > 0 && pendingHeavy && (
                            <span className="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-300 shadow" />
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

        {activeCell && activeCell.total > 0 && (
          <div
            className="relative z-10 mt-5 animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 duration-300 sm:p-5"
            style={{
              boxShadow: `inset 3px 0 0 ${colorForId(activeCell.employeeId).accent}`,
            }}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {activeCell.employeeName} · {activeCell.monthLabel}
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">
                  ₦{activeCell.total.toLocaleString()}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="h-3 w-3" />
                    Paid ₦{activeCell.paid.toLocaleString()}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Clock className="h-3 w-3" />
                    Pending ₦{activeCell.pending.toLocaleString()}
                  </span>
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
                      {MONTH_LABELS[(item.month || 1) - 1]} {item.year}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.status === "paid" ? "Paid" : "Pending"}
                      {item.paymentDate
                        ? ` · ${format(new Date(item.paymentDate), "MMM d, yyyy")}`
                        : ""}
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

      {/* Staff share + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="rounded-[22px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_28px_rgba(31,38,135,0.06)] backdrop-blur-xl lg:col-span-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Staff share
          </h3>
          {employees.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No employees in payroll yet.
            </p>
          ) : (
            <div className="space-y-3.5">
              {employees.slice(0, 8).map((emp) => {
                const palette = colorForId(emp.id);
                const pct =
                  totals.grand > 0
                    ? Math.round((emp.total / totals.grand) * 100)
                    : 0;
                return (
                  <div key={emp.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-slate-600">
                        {emp.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-400">
                        {pct}% · ₦{emp.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: palette.accent,
                          boxShadow:
                            pct > 0 ? `0 0 12px ${palette.glow}` : undefined,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_28px_rgba(31,38,135,0.06)] backdrop-blur-xl lg:col-span-7">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Recent salaries
          </h3>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nothing logged yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((item) => {
                const palette = colorForId(item.employee?._id || "unknown");
                return (
                  <li
                    key={item._id}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2.5 transition hover:border-slate-100 hover:bg-slate-50/80"
                  >
                    <Avatar className="h-10 w-10 shrink-0 border border-white shadow-sm">
                      <AvatarFallback
                        className="text-xs font-bold text-white"
                        style={{ backgroundColor: palette.accent }}
                      >
                        {initials(item.employee?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.employee?.name || "Unknown"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {MONTH_LABELS[(item.month || 1) - 1]} {item.year}
                        <span className="text-slate-300"> · </span>
                        <span
                          className={
                            item.status === "paid"
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }
                        >
                          {item.status === "paid" ? "Paid" : "Pending"}
                        </span>
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

export default SalaryHeatmap;
