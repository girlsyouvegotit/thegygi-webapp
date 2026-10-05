import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  money,
  saCard,
  saMainGrid,
  saPageShell,
  saPrimaryBtn,
  saSpan12,
  saSpan4,
  saSpan6,
  saSpan8,
  SaDarkPanel,
  SaEntityCard,
  SaPageHeader,
  SaRingCard,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaSection as SaHubSection } from "@/components/super-admin/SaHub";
import { SaHubSkeleton } from "@/components/loading/PageSkeleton";

const FinancePage = () => {
  const [finance, setFinance] = useState<{
    summary: Record<string, number>;
    overdueFees: Array<{
      _id: string;
      amount: number;
      dueDate: string;
      student?: { name?: string; email?: string; avatar?: string };
    }>;
    pendingSalaries: Array<{
      _id: string;
      amount: number;
      month: number;
      year: number;
      employee?: { name?: string; email?: string; avatar?: string; role?: string };
    }>;
    expenses?: Array<{
      _id: string;
      amount: number;
      category?: string;
      description?: string;
      date?: string;
    }>;
    comparison?: { mtd: number; priorMonth: number };
  } | null>(null);
  const [queues, setQueues] = useState<{
    overdueFees?: Array<{
      _id: string;
      amount: number;
      dueDate: string;
      student?: { name?: string; email?: string; avatar?: string };
    }>;
    pendingSalaries?: Array<{
      _id: string;
      amount: number;
      month: number;
      year: number;
      employee?: { name?: string; email?: string; avatar?: string; role?: string };
    }>;
    recentExpenses?: Array<{
      _id: string;
      amount: number;
      category?: string;
      description?: string;
    }>;
    expenses?: Array<{
      _id: string;
      amount: number;
      category?: string;
      description?: string;
    }>;
    comparison?: { mtd: number; priorMonth: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fin, q] = await Promise.all([
        api.get("/super-admin/finance"),
        api.get("/super-admin/treasury/queues").catch(() => null),
      ]);
      setFinance(fin.data.data.finance);
      if (q) setQueues(q.data.data?.queues || q.data.data || null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || "Failed to load finance command";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchFee = async (id: string, status: string) => {
    try {
      await api.patch(`/super-admin/finance/fees/${id}`, { status });
      toast.success(`Fee marked ${status}`);
      void load();
    } catch {
      toast.error("Fee update failed");
    }
  };

  const patchSalary = async (id: string, status: string) => {
    try {
      await api.patch(`/super-admin/finance/salaries/${id}`, { status });
      toast.success(`Salary marked ${status}`);
      void load();
    } catch {
      toast.error("Salary update failed");
    }
  };

  const exportCsv = async () => {
    try {
      const { data } = await api.get("/super-admin/treasury/queues", {
        params: { export: "csv" },
      });
      const csv = data.data?.csv || data.csv;
      if (!csv) {
        toast.error("No CSV payload");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "finance-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Finance CSV downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  if (loading && !finance) {
    return <SaHubSkeleton />;
  }

  if (error && !finance) {
    return (
      <div className={saPageShell}>
        <SaPageHeader
          eyebrow="GYGI Super Admin"
          title="Finance command"
          subtitle="Collectibles, payroll approvals, expenses, and exports (F29–F36)."
        />
        <div className={cn(saCard, "border-rose-100 bg-rose-50/40")}>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button type="button" className={cn(saPrimaryBtn, "mt-4")} onClick={() => void load()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!finance) return null;

  const s = finance.summary;
  const overdue = queues?.overdueFees || finance.overdueFees;
  const salaries = queues?.pendingSalaries || finance.pendingSalaries;
  const expenses =
    queues?.recentExpenses || queues?.expenses || finance.expenses || [];
  const comparison = queues?.comparison || finance.comparison;
  const outgoing =
    (s.salariesPendingTotal || 0) + (s.pendingTotal || 0) + (s.overdueTotal || 0);
  const totalFees =
    (s.collectedMonth || 0) + (s.pendingTotal || 0) + (s.overdueTotal || 0);
  const mtdPct =
    comparison && comparison.priorMonth > 0
      ? Math.min(100, (comparison.mtd / comparison.priorMonth) * 100)
      : comparison?.mtd
        ? 100
        : 0;

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow="GYGI Super Admin"
        title="Finance command"
        subtitle="Collectibles, payroll approvals, expenses, and exports (F29–F36)."
        actions={
          <SaSoftButton tone="primary" onClick={() => void exportCsv()}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </SaSoftButton>
        }
      />

      <div className={saMainGrid}>
        <div className={cn(saSpan4, "h-full")}>
          <SaDarkPanel
            title="Treasury totals"
            rows={[
              {
                label: "Collected this month",
                value: money(s.collectedMonth),
                color: "#22c55e",
              },
              {
                label: "Outgoing exposure",
                value: money(outgoing),
                color: "#FF9F43",
              },
              {
                label: "Payroll pending",
                value: money(s.salariesPendingTotal),
                color: "#c147e9",
              },
              {
                label: "Overdue fees",
                value: money(s.overdueTotal),
                color: "#f43f5e",
              },
            ]}
          />
        </div>

        <div className={cn(saSpan4, "h-full grid gap-5")}>
          <SaRingCard
            title="Pending fees"
            subtitle="Awaiting collection"
            percent={Math.min(
              100,
              s.collectedMonth
                ? ((s.pendingTotal || 0) / (s.collectedMonth + (s.pendingTotal || 1))) * 100
                : 0,
            )}
            tone="orange"
            footer={
              <p className="mt-3 text-xs font-bold text-muted-foreground">
                {money(s.pendingTotal)} open
              </p>
            }
          />
          <SaRingCard
            title="Payroll queue"
            subtitle={`${salaries.length} approvals`}
            percent={Math.min(100, salaries.length * 8)}
            tone="primary"
          />
        </div>

        <div className={cn(saSpan4, "h-full grid gap-5 sm:grid-cols-2 xl:grid-cols-1")}>
          <StatPill
            label="Total Fees"
            value={money(totalFees)}
            hint="Collected + open"
            nairaBg
          />
          <StatPill
            label="Pending fees"
            value={money(s.pendingTotal)}
            hint="F29"
            nairaBg
          />
          <StatPill
            label="Salaries pending"
            value={money(s.salariesPendingTotal)}
            hint="F30"
          />
          {comparison ? (
            <>
              <StatPill label="Revenue MTD" value={money(comparison.mtd)} hint="F35" />
              <StatPill
                label="Prior month"
                value={money(comparison.priorMonth)}
                hint="F35"
              />
            </>
          ) : null}
        </div>

        {comparison ? (
          <div className={cn(saSpan12, "h-full")}>
            <SaRingCard
              title="MTD vs prior month"
              subtitle="Revenue pace (F35)"
              percent={mtdPct}
              tone="green"
              footer={
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatPill label="MTD" value={money(comparison.mtd)} />
                  <StatPill label="Prior" value={money(comparison.priorMonth)} />
                </div>
              }
            />
          </div>
        ) : null}

        <div className={cn(saSpan6, "h-full space-y-4")}>
          <SaHubSection title="Overdue fee queue" hint="F31 — mark paid or reset">
            <div className="grid gap-5 md:grid-cols-1">
              {overdue.map((f) => (
                <SaEntityCard
                  key={f._id}
                  title={f.student?.name || "Student"}
                  meta={`${f.student?.email || "—"} · due ${f.dueDate?.slice(0, 10) || "—"}`}
                  tags={[
                    { label: money(f.amount), tone: "bg-rose-50 text-rose-700" },
                    { label: "Overdue", tone: "bg-rose-100 text-rose-800" },
                  ]}
                  actions={
                    <>
                      <SaSoftButton tone="success" onClick={() => void patchFee(f._id, "paid")}>
                        Mark paid
                      </SaSoftButton>
                      <SaSoftButton onClick={() => void patchFee(f._id, "pending")}>
                        Waive→pending
                      </SaSoftButton>
                    </>
                  }
                />
              ))}
              {!overdue.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No overdue fees</p>
              ) : null}
            </div>
          </SaHubSection>
        </div>

        <div className={cn(saSpan6, "h-full space-y-4")}>
          <SaHubSection title="Payout approval queue" hint="F32">
            <div className="grid gap-5 md:grid-cols-1">
              {salaries.map((sRow) => (
                <SaEntityCard
                  key={sRow._id}
                  title={sRow.employee?.name || "Employee"}
                  meta={`${sRow.employee?.role || "Staff"} · ${sRow.month}/${sRow.year}`}
                  tags={[
                    { label: money(sRow.amount), tone: "bg-amber-50 text-amber-800" },
                    { label: "Payroll", tone: "bg-primary/15 text-primary" },
                  ]}
                  actions={
                    <>
                      <SaSoftButton tone="success" onClick={() => void patchSalary(sRow._id, "paid")}>
                        Approve
                      </SaSoftButton>
                      <SaSoftButton tone="warn" onClick={() => void patchSalary(sRow._id, "pending")}>
                        Hold
                      </SaSoftButton>
                    </>
                  }
                />
              ))}
              {!salaries.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No pending salaries</p>
              ) : null}
            </div>
          </SaHubSection>
        </div>

        <section className={cn(saCard, saSpan8, "xl:col-span-12")}>
          <h2 className="text-base font-bold text-foreground">Expense review</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">F33 / F34</p>
          <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
            {expenses.map((e) => (
              <li
                key={e._id}
                className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3.5 ring-1 ring-border"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {e.description || e.category}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{e.category}</p>
                </div>
                <span className="text-lg font-black tabular-nums text-foreground">
                  {money(e.amount)}
                </span>
              </li>
            ))}
            {!expenses.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No recent expenses</p>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default FinancePage;
