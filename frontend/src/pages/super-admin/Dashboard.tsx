import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Radio,
  ShieldAlert,
  Users,
  Layers,
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaPageSkeleton } from "@/components/loading/PageSkeleton";
import {
  healthTone,
  money,
  saCard,
  saCardTight,
  saMainGrid,
  saPageShell,
  saPrimaryBtn,
  saSpan4,
  saSpan5,
  saSpan7,
  saSpan12,
  SaDarkPanel,
  SaEntityCard,
  SaPageHeader,
  SaRingCard,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import OccasionToast from "@/components/occasions/OccasionToast";

type Overview = {
  health: { score: number; status: string };
  pulse: Record<string, number>;
  census: Record<string, number>;
  finance: Record<string, number>;
  risk: {
    alerts: Array<{
      id: string;
      severity: string;
      title: string;
      detail: string;
      href: string;
    }>;
  };
  growth: { categoryGrowth: Array<{ name?: string; count: number }> };
  live: {
    classes: Array<{
      _id: string;
      title?: string;
      status?: string;
      tutor?: { name?: string };
      category?: { name?: string };
    }>;
  };
  activity: Array<{
    _id: string;
    action: string;
    createdAt: string;
    isAudit?: boolean;
    user?: { name?: string; avatar?: string };
  }>;
  platform: { maintenanceMode: boolean };
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [modStats, setModStats] = useState<{
    warned: number;
    suspended: number;
    banned: number;
  } | null>(null);
  const [clock, setClock] = useState(() => new Date());

  const fetchOverview = useCallback(async () => {
    try {
      const [{ data }, mod] = await Promise.all([
        api.get("/super-admin/overview"),
        api.get("/super-admin/moderation/overview").catch(() => null),
      ]);
      setOverview(data.data.overview as Overview);
      if (mod) setModStats(mod.data.data.stats);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to load command center");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
    const t = window.setInterval(() => void fetchOverview(), 45000);
    const c = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(c);
    };
  }, [fetchOverview]);

  const tone = healthTone(overview?.health.status);
  const firstName = user?.name?.split(" ")[0] || "Commander";

  const chartData = useMemo(
    () =>
      (overview?.growth.categoryGrowth || []).map((c) => ({
        name: (c.name || "Cat").slice(0, 8),
        enrollments: c.count,
      })),
    [overview],
  );

  if (loading && !overview) {
    return <SaPageSkeleton />;
  }

  const healthPct = overview?.health.score ?? 0;

  return (
    <div className={saPageShell}>
      <OccasionToast className="mb-4" />
      <SaPageHeader
        eyebrow="GYGI · Command Center"
        title="Command Center"
        subtitle={`Welcome back, ${firstName}. Live platform truth — people, money, classrooms, risk.`}
        actions={
          <>
            <div className="hidden items-center gap-4 rounded-2xl bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm ring-1 ring-border sm:flex">
              <span className="tabular-nums text-muted-foreground">
                {clock.toLocaleTimeString()}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1",
                  tone.chip,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                {tone.label}
              </span>
            </div>
            <button
              type="button"
              className={saPrimaryBtn}
              onClick={() => navigate("/super-admin/moderation")}
            >
              Open moderation
            </button>
          </>
        }
      />

      <div className={saMainGrid}>
        {/* Dark totals */}
        <div className={cn(saSpan4, "h-full")}>
          <SaDarkPanel
            title="Platform totals"
            rows={[
              {
                label: "Students",
                value: (overview?.census.totalStudents ?? 0).toLocaleString(),
                color: "#c147e9",
              },
              {
                label: "Tutors",
                value: (overview?.census.totalTutors ?? 0).toLocaleString(),
                color: "#22c55e",
              },
              {
                label: "Mentors",
                value: (overview?.census.totalMentors ?? 0).toLocaleString(),
                color: "#5B5FEF",
              },
              {
                label: "Active today",
                value: (overview?.pulse.activeUsersToday ?? 0).toLocaleString(),
                color: "#FF9F43",
              },
            ]}
          />
        </div>

        {/* Rings + health */}
        <div className={cn(saSpan4, "grid h-full gap-5")}>
          <SaRingCard
            title="Health score"
            subtitle={
              overview?.platform.maintenanceMode
                ? "Maintenance ON"
                : "Systems accepting traffic"
            }
            percent={healthPct}
            tone="primary"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <SaRingCard
              title="Live classes"
              subtitle="Now"
              percent={Math.min(
                100,
                (overview?.pulse.liveClassesNow ?? 0) * 12,
              )}
              tone="blue"
            />
            <SaRingCard
              title="Active rooms"
              subtitle="Video"
              percent={Math.min(100, (overview?.pulse.activeRooms ?? 0) * 15)}
              tone="orange"
            />
          </div>
        </div>

        {/* Live entity cards */}
        <div className={cn(saSpan4, "grid h-full gap-5")}>
          {(overview?.live.classes || []).slice(0, 3).map((c) => (
            <SaEntityCard
              key={c._id}
              title={c.title || "Class"}
              tags={[
                {
                  label: c.status || "scheduled",
                  tone:
                    c.status === "live"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-muted text-muted-foreground",
                },
                {
                  label: c.category?.name || "Category",
                  tone: "bg-primary/15 text-primary",
                },
              ]}
              meta={c.tutor?.name || "Tutor"}
              actions={
                <SaSoftButton
                  tone="primary"
                  onClick={() => navigate("/super-admin/live-ops")}
                >
                  Open
                </SaSoftButton>
              }
            />
          ))}
          {!overview?.live.classes?.length ? (
            <SaEntityCard
              className="h-full min-h-[220px]"
              title="No live classes"
              meta="Schedule or wait for upcoming sessions"
              tags={[{ label: "Quiet" }]}
              actions={
                <SaSoftButton onClick={() => navigate("/super-admin/live-ops")}>
                  Live Ops
                </SaSoftButton>
              }
            />
          ) : null}
        </div>

        {/* Pulse strip */}
        <div
          className={cn(
            saSpan12,
            "grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5",
          )}
        >
          {[
            {
              label: "Active today",
              value: overview?.pulse.activeUsersToday ?? 0,
              icon: Users,
            },
            {
              label: "Live classes",
              value: overview?.pulse.liveClassesNow ?? 0,
              icon: Radio,
            },
            {
              label: "Active rooms",
              value: overview?.pulse.activeRooms ?? 0,
              icon: Activity,
            },
            {
              label: "Sessions today",
              value: overview?.pulse.sessionsToday ?? 0,
              icon: Layers,
            },
          ].map((c) => (
            <div key={c.label} className={saCardTight}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                  {c.label}
                </p>
                <c.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Finance + chart */}
        <section className={cn(saCard, saSpan7, "flex h-full flex-col")}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Category enrollments
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Load by program</p>
            </div>
            <SaSoftButton
              tone="primary"
              onClick={() => navigate("/super-admin/growth")}
            >
              Growth <ArrowUpRight className="ml-1 h-3 w-3" />
            </SaSoftButton>
          </div>
          <div className="h-64 w-full min-h-[220px] flex-1">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(193,71,233,0.06)" }}
                    contentStyle={{
                      borderRadius: 16,
                      border: "none",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar
                    dataKey="enrollments"
                    fill="#c147e9"
                    radius={[10, 10, 10, 10]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No enrollment data yet
              </div>
            )}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatPill
              label="Collected (month)"
              value={money(overview?.finance.feesCollectedMonth)}
              valueClassName="text-emerald-600"
            />
            <StatPill
              label="Net month"
              value={money(overview?.finance.netMonth)}
              valueClassName={
                (overview?.finance.netMonth || 0) >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }
            />
          </div>
        </section>

        {/* Risk + moderation + activity */}
        <section
          className={cn(
            saCard,
            saSpan5,
            "flex h-full min-h-[220px] flex-col",
          )}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[#FF9F43]" />
              <h2 className="text-base font-bold text-foreground">Risk & audit</h2>
            </div>
            <SaSoftButton onClick={() => navigate("/super-admin/security")}>
              Security
            </SaSoftButton>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatPill label="Warned" value={modStats?.warned ?? 0} />
            <StatPill
              label="Suspended"
              value={modStats?.suspended ?? 0}
              valueClassName="text-amber-700"
            />
            <StatPill
              label="Banned"
              value={modStats?.banned ?? 0}
              valueClassName="text-rose-700"
            />
          </div>

          <button
            type="button"
            className={cn(saPrimaryBtn, "mb-5 w-full")}
            onClick={() => navigate("/super-admin/moderation")}
          >
            <ShieldAlert className="mr-2 h-4 w-4" />
            Moderation desk
          </button>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {(overview?.risk.alerts || []).map((a) => (
              <div
                key={a.id}
                className="rounded-2xl bg-muted px-4 py-3.5.5 ring-1 ring-border"
              >
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {a.detail}
                </p>
                <div className="mt-3">
                  <SaSoftButton
                    tone={a.severity === "critical" ? "danger" : "warn"}
                    onClick={() => navigate(a.href)}
                  >
                    Open
                  </SaSoftButton>
                </div>
              </div>
            ))}
            {(overview?.activity || []).slice(0, 5).map((a) => (
              <div key={a._id} className="flex items-center gap-4 px-1 py-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={a.user?.avatar} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {a.user?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {a.action}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {a.user?.name || "System"} ·{" "}
                    {formatDistanceToNow(new Date(a.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Auto-refreshes every 45s · {user?.email}
      </p>
    </div>
  );
};

export default SuperAdminDashboard;
