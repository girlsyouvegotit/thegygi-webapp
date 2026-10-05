import {
  saMainGrid,
  saSpan4,
  saSpan5,
  saSpan6,
  saSpan7,
  SaDarkPanel,
  SaEntityCard,
  SaRingCard,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";
import { cn } from "@/lib/utils";

type GrowthHub = {
  signupFunnel: {
    "1d": Record<string, number>;
    "7d": Record<string, number>;
    "30d": Record<string, number>;
  };
  presenceByRole: Array<{ role: string; count: number }>;
  retentionCohorts: Record<string, number>;
  churnRisk: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt?: string;
  }>;
  categoryGrowth: Array<{ name?: string; count: number }>;
};

const total = (obj?: Record<string, number>) =>
  Object.values(obj || {}).reduce((a, b) => a + (b || 0), 0);

export default function GrowthPage() {
  const { data, loading, error, reload } = useSaHub<GrowthHub>(
    "/super-admin/growth",
    "Failed to load growth hub",
  );

  const presenceTotal =
    data?.presenceByRole?.reduce((a, r) => a + (r.count || 0), 0) || 0;
  const signups30 = total(data?.signupFunnel["30d"]);
  const signups7 = total(data?.signupFunnel["7d"]);
  const signups1 = total(data?.signupFunnel["1d"]);
  const retentionTotal = Object.values(data?.retentionCohorts || {}).reduce(
    (a, b) => a + b,
    0,
  );
  const topCategory = data?.categoryGrowth?.[0];

  return (
    <SaHubShell
      title="Growth intelligence"
      subtitle="Signup funnel, presence, retention cohorts, and churn risk (F09–F13)."
      loading={loading && !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Signup velocity"
              rows={[
                { label: "Last 24 hours", value: signups1, color: "#c147e9" },
                { label: "Last 7 days", value: signups7, color: "#5B5FEF" },
                { label: "Last 30 days", value: signups30, color: "#22c55e" },
                {
                  label: "Active today",
                  value: presenceTotal,
                  color: "#FF9F43",
                },
              ]}
            />
          </div>

          <div className={cn(saSpan4, "h-full grid gap-5")}>
            <SaRingCard
              title="7d vs 30d signups"
              subtitle="Weekly share of monthly"
              percent={
                signups30 > 0 ? Math.min(100, (signups7 / signups30) * 100) : 0
              }
              tone="primary"
            />
            <SaRingCard
              title="Today vs 7d"
              subtitle="Daily momentum"
              percent={
                signups7 > 0 ? Math.min(100, (signups1 / signups7) * 100 * 7) : 0
              }
              tone="blue"
            />
          </div>

          <div className={cn(saSpan4, "grid h-full gap-5")}>
            <StatPill
              label="Churn risk users"
              value={data.churnRisk?.length || 0}
              hint="F10 · 21+ days quiet"
            />
            <StatPill
              label="Top category (30d)"
              value={topCategory?.count ?? "—"}
              hint={topCategory?.name || "No enrollments"}
            />
            <StatPill
              label="Retention buckets"
              value={retentionTotal}
              hint="F11 cohort sum"
            />
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Presence by role (today)" hint="F12">
              <ul className="space-y-4">
                {(data.presenceByRole || []).map((row) => {
                  const pct =
                    presenceTotal > 0
                      ? Math.round((row.count / presenceTotal) * 100)
                      : 0;
                  return (
                    <li
                      key={row.role}
                      className="rounded-2xl bg-muted px-4 py-3.5 ring-1 ring-border"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold capitalize text-foreground">
                          {row.role}
                        </span>
                        <span className="font-black tabular-nums">{row.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#c147e9]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
                {!data.presenceByRole?.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No presence data today
                  </p>
                ) : null}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Retention cohorts" hint="F11 — last login buckets">
              <ul className="space-y-4">
                {Object.entries(data.retentionCohorts || {}).map(([k, n]) => (
                  <li
                    key={k}
                    className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3.5 text-sm ring-1 ring-border"
                  >
                    <span className="font-bold text-foreground">{k}</span>
                    <span className="font-black tabular-nums">{n}</span>
                  </li>
                ))}
                {!Object.keys(data.retentionCohorts || {}).length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No cohort data yet
                  </p>
                ) : null}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan5, "h-full")}>
            <SaSection title="Category growth (30d enrollments)" hint="F13">
              {data.categoryGrowth?.length ? (
                <ul className="max-h-96 space-y-3 overflow-y-auto">
                  {data.categoryGrowth.map((c, i) => (
                    <li
                      key={`${c.name}-${i}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-50/80 px-4 py-3.5 text-sm ring-1 ring-emerald-100/80"
                    >
                      <span className="min-w-0 truncate font-bold text-foreground">
                        {c.name || "Unknown"}
                      </span>
                      <span className="shrink-0 font-black tabular-nums">
                        {c.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-[160px] items-center justify-center rounded-2xl bg-muted px-6 py-10 text-center ring-1 ring-border">
                  <p className="text-sm text-muted-foreground">No growth data yet</p>
                </div>
              )}
            </SaSection>
          </div>

          <div className={cn(saSpan7, "h-full")}>
            <SaSection title="Churn / inactive risk" hint="F10 — 21+ days quiet">
              {data.churnRisk?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 sm:[&>:last-child:nth-child(odd)]:col-span-2">
                  {data.churnRisk.map((u) => (
                    <SaEntityCard
                      key={u._id}
                      className="h-full"
                      title={u.name}
                      tags={[
                        {
                          label: u.role,
                          tone: "bg-amber-50 text-amber-800",
                        },
                      ]}
                      meta={u.email}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-2xl bg-muted px-6 py-12 text-center ring-1 ring-border">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      No risk users
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Everyone has logged in within the window.
                    </p>
                  </div>
                </div>
              )}
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
}
