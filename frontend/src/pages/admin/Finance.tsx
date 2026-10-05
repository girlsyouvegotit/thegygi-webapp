import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowUpRight,
  Banknote,
  Download,
  GraduationCap,
  LayoutDashboard,
    Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import FeeCollection from "@/pages/finance/FeeCollection";
import Expenses from "@/pages/finance/Expenses";
import Salary from "@/pages/finance/Salary";
import NairaWatermark from "@/components/finance/NairaWatermark";
import { TablePageSkeleton } from "@/components/loading/PageSkeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Expense, Fee, Salary as SalaryType } from "@/types";

type FinanceTab = "overview" | "fees" | "expenses" | "salary";

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  signed: number;
  date: string;
  kind: "fee" | "expense" | "salary";
}

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

const glass =
  "rounded-[24px] border border-white/50 bg-white/55 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.08)]";

const Finance = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<FinanceTab>("overview");
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<Fee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salaries, setSalaries] = useState<SalaryType[]>([]);
  const [modules, setModules] = useState({
    fees: true,
    expenses: true,
    salaries: true,
  });

  const firstName = user?.name?.split(" ")[0] || "Admin";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [feesRes, expensesRes, salariesRes] = await Promise.all([
        api.get("/finance/fees?page=1&limit=100"),
        api.get("/finance/expenses?page=1&limit=100"),
        api.get("/finance/salaries?page=1&limit=100"),
      ]);
      setFees(feesRes.data.data?.fees ?? []);
      setExpenses(expensesRes.data.data?.expenses ?? []);
      setSalaries(salariesRes.data.data?.salaries ?? []);
    } catch (error) {
      console.error("Failed to load finance overview:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const metrics = useMemo(() => {
    const totalFees = fees.reduce((s, f) => s + (f.amount || 0), 0);
    const paidFees = fees
      .filter((f) => f.status === "paid")
      .reduce((s, f) => s + (f.amount || 0), 0);
    const pendingFees = fees
      .filter((f) => f.status === "pending" || f.status === "overdue")
      .reduce((s, f) => s + (f.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalSalaries = salaries.reduce((s, sItem) => s + (sItem.amount || 0), 0);
    const paidSalaries = salaries
      .filter((s) => s.status === "paid")
      .reduce((sum, s) => sum + (s.amount || 0), 0);
    const collectionRate =
      totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;
    const net = paidFees - totalExpenses - paidSalaries;

    return {
      totalFees,
      paidFees,
      pendingFees,
      totalExpenses,
      totalSalaries,
      paidSalaries,
      collectionRate,
      net,
    };
  }, [fees, expenses, salaries]);

  const chartData = useMemo(() => {
    const year = new Date().getFullYear();
    return MONTH_LABELS.map((label, index) => {
      const month = index + 1;
      const revenue = fees
        .filter((f) => {
          const d = new Date(f.paymentDate || f.dueDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        })
        .reduce((s, f) => s + (f.amount || 0), 0);
      const expense = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        })
        .reduce((s, e) => s + (e.amount || 0), 0);
      const salaryCost = salaries
        .filter((s) => s.year === year && s.month === month)
        .reduce((sum, s) => sum + (s.amount || 0), 0);
      return {
        month: label,
        fees: revenue,
        expenses: expense + salaryCost,
      };
    });
  }, [fees, expenses, salaries]);

  const activity = useMemo<ActivityItem[]>(() => {
    const feeItems: ActivityItem[] = fees.map((f) => ({
      id: `fee-${f._id}`,
      title: f.student?.name || "Student fee",
      subtitle: f.description || `Fee · ${f.status}`,
      amount: f.amount,
      signed: f.status === "paid" ? f.amount : 0,
      date: f.paymentDate || f.dueDate || f.createdAt || "",
      kind: "fee",
    }));
    const expenseItems: ActivityItem[] = expenses.map((e) => ({
      id: `exp-${e._id}`,
      title: e.description || "Expense",
      subtitle: `${e.category} · expense`,
      amount: e.amount,
      signed: -e.amount,
      date: e.date || e.createdAt || "",
      kind: "expense",
    }));
    const salaryItems: ActivityItem[] = salaries.map((s) => ({
      id: `sal-${s._id}`,
      title: s.employee?.name || "Salary",
      subtitle: `Salary · ${MONTH_LABELS[(s.month || 1) - 1]} ${s.year}`,
      amount: s.amount,
      signed: s.status === "paid" ? -s.amount : 0,
      date: s.paymentDate || s.createdAt || "",
      kind: "salary",
    }));

    return [...feeItems, ...expenseItems, ...salaryItems]
      .filter((a) => a.date)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 6);
  }, [fees, expenses, salaries]);

  const insightBars = useMemo(() => {
    const max = Math.max(
      metrics.paidFees,
      metrics.totalExpenses,
      metrics.paidSalaries,
      1,
    );
    return [
      { label: "Fees collected", value: metrics.paidFees, color: "#c147e9" },
      { label: "Expenses", value: metrics.totalExpenses, color: "#22c55e" },
      { label: "Salaries paid", value: metrics.paidSalaries, color: "#64748b" },
    ].map((row) => ({
      ...row,
      pct: Math.round((row.value / max) * 100),
    }));
  }, [metrics]);

  const tabs: { id: FinanceTab; label: string; icon: typeof LayoutDashboard }[] =
    [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "fees", label: "Fees", icon: Wallet },
      { id: "expenses", label: "Expenses", icon: Receipt },
      { id: "salary", label: "Salary", icon: Users },
    ];

  const kindIcon = (kind: ActivityItem["kind"]) => {
    if (kind === "fee") return GraduationCap;
    if (kind === "expense") return Receipt;
    return Banknote;
  };

  const exportCsv = () => {
    const rows = [
      ["Type", "Title", "Amount", "Date"],
      ...activity.map((a) => [
        a.kind,
        a.title,
        String(a.signed || a.amount),
        a.date ? format(new Date(a.date), "yyyy-MM-dd") : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gygi-finance-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] min-w-0 overflow-x-hidden rounded-[20px] border border-white/40 sm:rounded-[24px]">
      {/* Soft ethereal backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ebe4f5] via-[#f3f0f7] to-[#e8eef6]" />
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-[#a78bfa]/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative z-10 space-y-5 p-3 sm:space-y-6 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
            <p className="text-sm font-medium text-slate-500">
              {greeting}, {firstName}.
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Finance
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
          Manage fees, expenses, and salaries
        </p>
      </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                glass,
                "flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600",
              )}
            >
              <span className="tabular-nums">
                {format(new Date(), "MMM.dd.yyyy")}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={exportCsv}
              className={cn(
                glass,
                "h-10 gap-2 border-white/60 bg-white/70 text-slate-700 hover:bg-white/90",
              )}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Pill navigation */}
        <div
          className={cn(
            glass,
            "inline-flex max-w-full flex-wrap gap-1 p-1.5",
          )}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                tab === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {loading ? (
                <TablePageSkeleton />
              ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                {/* Left column */}
                <div className="space-y-5 xl:col-span-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={cn(glass, "relative overflow-hidden p-5")}>
                      <NairaWatermark tone="brand" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-slate-500">Total Fees</p>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <TrendingUp className="h-3 w-3" />
                            {metrics.collectionRate}%
                          </span>
                        </div>
                        <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                          ₦{metrics.totalFees.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          ₦{metrics.paidFees.toLocaleString()} collected
                        </p>
                      </div>
                    </div>

                    <div className={cn(glass, "p-5")}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-500">Total Expenses</p>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          <TrendingDown className="h-3 w-3" />
                          Outflow
                        </span>
                      </div>
                      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                        ₦{metrics.totalExpenses.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Salaries ₦{metrics.totalSalaries.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className={cn(glass, "p-5 md:p-6")}>
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">
                          Fees vs Expenses
                        </h2>
                        <p className="text-xs text-slate-400">
                          Monthly breakdown · {new Date().getFullYear()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          Fees
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Expenses
                        </span>
                      </div>
                    </div>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={4}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                          />
                          <YAxis hide />
                          <Tooltip
                            cursor={{ fill: "rgba(193,71,233,0.06)" }}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.6)",
                              background: "rgba(255,255,255,0.95)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                              fontSize: 12,
                            }}
                            formatter={(value: number) =>
                              `₦${Number(value).toLocaleString()}`
                            }
                          />
                          <Bar
                            dataKey="fees"
                            fill="#c147e9"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={18}
                          />
                          <Bar
                            dataKey="expenses"
                            fill="#22c55e"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={18}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Middle column */}
                <div className="space-y-5 xl:col-span-4">
                  <div className={cn(glass, "p-5")}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-slate-900">
                        Money Insight
                      </h2>
                      <span className="text-xs text-slate-400">This period</span>
                    </div>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                      ₦{Math.abs(metrics.net).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {metrics.net >= 0 ? "Net surplus" : "Net deficit"} after
                      expenses & salaries
                    </p>
                    <div className="mt-5 space-y-3">
                      {insightBars.map((row) => (
                        <div key={row.label}>
                          <div className="mb-1 flex justify-between text-xs text-slate-500">
                            <span>{row.label}</span>
                            <span className="tabular-nums">
                              ₦{row.value.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${row.pct}%`,
                                backgroundColor: row.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn(glass, "p-5")}>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">
                      Activity
                    </h2>
                    {activity.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-400">
                        No recent finance activity yet.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {activity.map((item) => {
                          const Icon = kindIcon(item.kind);
                          return (
                            <li
                              key={item.id}
                              className="flex items-center gap-3"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-slate-100">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800">
                                  {item.title}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  {item.subtitle}
                                  {item.date
                                    ? ` · ${format(new Date(item.date), "MMM d")}`
                                    : ""}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "shrink-0 text-sm font-semibold tabular-nums",
                                  item.signed > 0
                                    ? "text-emerald-600"
                                    : item.signed < 0
                                      ? "text-rose-500"
                                      : "text-slate-500",
                                )}
                              >
                                {item.signed > 0 ? "+" : item.signed < 0 ? "−" : ""}
                                ₦{Math.abs(item.signed || item.amount).toLocaleString()}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className={cn(glass, "p-5")}>
                    <h2 className="mb-4 text-base font-semibold text-slate-900">
                      Finance Modules
                    </h2>
                    <ul className="space-y-3">
                      {(
                        [
                          {
                            key: "fees" as const,
                            label: "Fee Collection",
                            desc: "Student fees & dues",
                            icon: Wallet,
                          },
                          {
                            key: "expenses" as const,
                            label: "Expenses",
                            desc: "School operating costs",
                            icon: Receipt,
                          },
                          {
                            key: "salaries" as const,
                            label: "Salaries",
                            desc: "Staff payroll records",
                            icon: Users,
                          },
                        ] as const
                      ).map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <li
                            key={mod.key}
                            className="flex items-center gap-3"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setTab(
                                  mod.key === "salaries" ? "salary" : mod.key,
                                )
                              }
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800">
                                  {mod.label}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {mod.desc}
                                </p>
                              </div>
                            </button>
                            <Switch
                              checked={modules[mod.key]}
                              onCheckedChange={(checked) =>
                                setModules((prev) => ({
                                  ...prev,
                                  [mod.key]: checked,
                                }))
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-5 xl:col-span-3">
                  <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#7c1fa8] via-primary to-[#a91cc0] p-6 text-white shadow-[0_12px_40px_rgba(193,71,233,0.35)]">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <p className="text-xs font-medium text-white/70">
                      Collection health
                    </p>
                    <h2 className="mt-2 text-xl font-bold leading-snug">
                      {metrics.collectionRate >= 70
                        ? "Fee collection is on track"
                        : metrics.collectionRate >= 40
                          ? "Collection needs attention"
                          : "Push pending fee follow-ups"}
                    </h2>
                    <p className="mt-2 text-sm text-white/75">
                      ₦{metrics.pendingFees.toLocaleString()} still pending or
                      overdue across {fees.length} fee records.
                    </p>
                    <Button
                      onClick={() => setTab("fees")}
                      className="mt-5 h-10 rounded-full bg-white text-primary hover:bg-white/90"
                    >
                      Overview
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <div className={cn(glass, "flex flex-col p-6")}>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Wallet className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Quick actions
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Jump into the workflow you need today.
                    </p>
                    <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Record student fee payments
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Log school expenses by category
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Manage staff salary status
                      </li>
                    </ul>
                    <div className="mt-6 space-y-2">
                      <Button
                        onClick={() => setTab("fees")}
                        className="w-full justify-start gap-2 rounded-2xl"
                      >
                        <Plus className="h-4 w-4" />
                        Record Payment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setTab("expenses")}
                        className="w-full justify-start gap-2 rounded-2xl border-white/70 bg-white/50"
                      >
                        <Receipt className="h-4 w-4" />
                        Add Expense
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setTab("salary")}
                        className="w-full justify-start gap-2 rounded-2xl border-white/70 bg-white/50"
                      >
                        <Users className="h-4 w-4" />
                        Add Salary
                      </Button>
                    </div>

                    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/50 p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                          {firstName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {user?.name || "Admin"}
                        </p>
                        <p className="text-xs text-slate-400">Finance admin</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "fees" && (
          <div className={cn(glass, "overflow-hidden")}>
            <FeeCollection embedded />
          </div>
        )}
        {tab === "expenses" && (
          <div className={cn(glass, "overflow-hidden")}>
            <Expenses embedded />
          </div>
        )}
        {tab === "salary" && (
          <div className={cn(glass, "overflow-hidden")}>
            <Salary embedded />
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;
