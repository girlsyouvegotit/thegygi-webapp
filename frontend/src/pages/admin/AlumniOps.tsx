import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  ExternalLink,
  GraduationCap,
  Loader2,
  MessageCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { TablePageSkeleton } from "@/components/loading/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import JobMatchCard from "@/components/jobs/JobMatchCard";
import JobMatchGrid from "@/components/jobs/JobMatchGrid";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Tab = "overview" | "alumni" | "jobs" | "portfolio" | "community";

type Monitor = {
  stats: {
    alumniStudents: number;
    completedEnrollments: number;
    portfolioTotal: number;
    portfolioPending: number;
    portfolioReviewed: number;
    portfolioNeedsChanges: number;
    alumniChannelsReady: number;
    alumniChannelsMissing: number;
  };
  alumni: Array<{
    studentId: string;
    name: string;
    email: string;
    isActive?: boolean;
    programs: Array<{ name: string; completedAt?: string | null }>;
    latestCompletedAt?: string | null;
  }>;
  alumniChannels: Array<{
    communityId: string;
    categoryName: string;
    hasAlumniChannel: boolean;
    memberCount: number;
  }>;
};

type CareerJob = {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  salary?: string;
  category: string;
  tags: string[];
  source: string;
  publishedAt?: string;
  companyLogo?: string;
  matchedCategories?: string[];
};

type PlatformCategory = {
  _id: string;
  name: string;
};

type PortfolioRow = {
  _id: string;
  title: string;
  url: string;
  notes?: string;
  status: string;
  feedback?: string;
  createdAt: string;
  student?: { name?: string; email?: string } | null;
  reviewer?: { name?: string } | null;
  category?: { name?: string } | null;
};

const PIE_COLORS = {
  pending: "#c147e9",
  needs: "#FF9F43",
  reviewed: "#22c55e",
};

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AlumniOpsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobCategoryId, setJobCategoryId] = useState("");
  const [platformCategories, setPlatformCategories] = useState<
    PlatformCategory[]
  >([]);
  const [attribution, setAttribution] = useState("");
  const [matchedFrom, setMatchedFrom] = useState<string[]>([]);
  const [reviews, setReviews] = useState<PortfolioRow[]>([]);
  const [portfolioFilter, setPortfolioFilter] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadMonitor = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/post-program/admin/monitor");
      setMonitor(data.data as Monitor);
    } catch {
      toast.error("Could not load alumni monitor");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobs = useCallback(
    async (search?: string, categoryId?: string) => {
      setJobsLoading(true);
      try {
        const { data } = await api.get("/post-program/admin/jobs", {
          params: {
            search: search || undefined,
            categoryId: categoryId || undefined,
            limit: 30,
          },
        });
        setJobs((data.data?.jobs || []) as CareerJob[]);
        setAttribution(data.data?.attribution || "");
        setMatchedFrom(
          (data.data?.matchedFromCategories as string[]) || [],
        );
      } catch {
        toast.error("Could not load job feed");
      } finally {
        setJobsLoading(false);
      }
    },
    [],
  );

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      setPlatformCategories(
        ((data.data?.categories || []) as PlatformCategory[]).filter(
          (c) => c._id && c.name,
        ),
      );
    } catch {
      /* non-blocking */
    }
  }, []);

  const loadPortfolio = useCallback(async (status?: string) => {
    try {
      const { data } = await api.get("/post-program/admin/portfolio", {
        params: status ? { status } : undefined,
      });
      setReviews((data.data?.reviews || []) as PortfolioRow[]);
    } catch {
      toast.error("Could not load portfolios");
    }
  }, []);

  useEffect(() => {
    void loadMonitor();
    void loadCategories();
  }, [loadMonitor, loadCategories]);

  useEffect(() => {
    if (tab === "overview" || tab === "jobs") {
      void loadJobs(undefined, jobCategoryId || undefined);
    }
    if (tab === "overview" || tab === "portfolio") {
      void loadPortfolio(
        tab === "portfolio" ? portfolioFilter || undefined : undefined,
      );
    }
  }, [tab, loadJobs, loadPortfolio, portfolioFilter, jobCategoryId]);

  const syncChannels = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post("/post-program/admin/ensure-channels");
      toast.success(
        `Alumni channels ready (${data.data?.created || 0} created)`,
      );
      await loadMonitor();
    } catch {
      toast.error("Could not sync alumni channels");
    } finally {
      setSyncing(false);
    }
  };

  const review = async (id: string, status: "reviewed" | "needs_changes") => {
    const body = (feedback[id] || "").trim();
    if (body.length < 2) {
      toast.error("Write feedback first");
      return;
    }
    setBusyId(id);
    try {
      await api.post(`/post-program/portfolio/${id}/review`, {
        status,
        feedback: body,
      });
      toast.success("Feedback sent");
      setFeedback((prev) => ({ ...prev, [id]: "" }));
      await Promise.all([
        loadPortfolio(portfolioFilter || undefined),
        loadMonitor(),
      ]);
    } catch {
      toast.error("Could not send feedback");
    } finally {
      setBusyId(null);
    }
  };

  const stats = monitor?.stats;

  const programBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of monitor?.alumni || []) {
      for (const p of a.programs) {
        const name = p.name || "Program";
        map.set(name, (map.get(name) || 0) + 1);
      }
    }
    const total = [...map.values()].reduce((s, n) => s + n, 0) || 1;
    return [...map.entries()]
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [monitor?.alumni]);

  const portfolioPie = useMemo(() => {
    const pending = stats?.portfolioPending ?? 0;
    const needs = stats?.portfolioNeedsChanges ?? 0;
    const reviewed = stats?.portfolioReviewed ?? 0;
    return [
      { name: "Pending", value: pending, color: PIE_COLORS.pending },
      { name: "Needs changes", value: needs, color: PIE_COLORS.needs },
      { name: "Reviewed", value: reviewed, color: PIE_COLORS.reviewed },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const pipelineBars = useMemo(
    () => [
      { label: "Pending", value: stats?.portfolioPending ?? 0, fill: "#c147e9" },
      {
        label: "Changes",
        value: stats?.portfolioNeedsChanges ?? 0,
        fill: "#FF9F43",
      },
      { label: "Reviewed", value: stats?.portfolioReviewed ?? 0, fill: "#22c55e" },
      { label: "Alumni", value: stats?.alumniStudents ?? 0, fill: "#5B5FEF" },
      {
        label: "Programs",
        value: stats?.completedEnrollments ?? 0,
        fill: "#8b5cf6",
      },
    ],
    [stats],
  );

  const channelReadyPct = useMemo(() => {
    const ready = stats?.alumniChannelsReady ?? 0;
    const missing = stats?.alumniChannelsMissing ?? 0;
    const total = ready + missing;
    if (!total) return 100;
    return Math.round((ready / total) * 100);
  }, [stats]);

  const alumniActivePct = useMemo(() => {
    const list = monitor?.alumni || [];
    if (!list.length) return 0;
    const active = list.filter((a) => a.isActive !== false).length;
    return Math.round((active / list.length) * 100);
  }, [monitor?.alumni]);

  const gaugeR = 56;
  const gaugeC = Math.PI * gaugeR;
  const gaugeOffset = gaugeC - (channelReadyPct / 100) * gaugeC;

  if (loading && !monitor) {
    return (
      <TablePageSkeleton />
    );
  }

  const kpis: Array<{
    label: string;
    value: number;
    delta: number;
    up: boolean;
    hint: string;
    icon: typeof GraduationCap;
    tab: Tab;
    onOpen?: () => void;
  }> = [
    {
      label: "Alumni students",
      value: stats?.alumniStudents ?? 0,
      delta: alumniActivePct,
      up: true,
      hint: `${alumniActivePct}% active`,
      icon: GraduationCap,
      tab: "alumni",
    },
    {
      label: "Portfolio pending",
      value: stats?.portfolioPending ?? 0,
      delta: stats?.portfolioTotal
        ? Math.round(
            ((stats.portfolioPending || 0) / stats.portfolioTotal) * 100,
          )
        : 0,
      up: false,
      hint: "awaiting review",
      icon: Briefcase,
      tab: "portfolio",
      onOpen: () => setPortfolioFilter("pending"),
    },
    {
      label: "Job matches",
      value: jobs.length,
      delta: jobs.length ? 12 : 0,
      up: true,
      hint: "live feed roles",
      icon: Briefcase,
      tab: "jobs",
    },
    {
      label: "Channels ready",
      value: stats?.alumniChannelsReady ?? 0,
      delta: channelReadyPct,
      up: (stats?.alumniChannelsMissing ?? 0) === 0,
      hint:
        (stats?.alumniChannelsMissing ?? 0) > 0
          ? `${stats?.alumniChannelsMissing} missing`
          : "all communities",
      icon: MessageCircle,
      tab: "community",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1680px] min-w-0 space-y-5 overflow-x-hidden pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-400">
            After graduation · GYGI ops
          </p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-[#2D2D44] sm:text-2xl">
            Alumni & career ops
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Monitor graduates, job matches, portfolio reviews, and alumni
            community channels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 rounded-[1.5rem] bg-white p-2.5 shadow-sm ring-1 ring-slate-100 sm:gap-2.5 sm:p-3">
            {(
              [
                ["overview", "Overview"],
                ["alumni", "Alumni"],
                ["jobs", "Jobs"],
                ["portfolio", "Portfolios"],
                ["community", "Community"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "rounded-full px-4 py-2.5 text-xs font-bold transition sm:px-5",
                  tab === id
                    ? "bg-[#2D2D44] text-white shadow-sm"
                    : "text-slate-500 hover:bg-[#F7F6FB] hover:text-slate-800",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full"
            onClick={() => void loadMonitor()}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            type="button"
            className="h-10 rounded-full"
            disabled={syncing}
            onClick={() => void syncChannels()}
          >
            {syncing ? "Syncing…" : "Sync channels"}
          </Button>
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card) => {
          const active = tab === card.tab;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                card.onOpen?.();
                setTab(card.tab);
              }}
              className={cn(
                "rounded-[1.25rem] border bg-white p-4 text-left shadow-sm transition-all sm:p-5",
                "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                "active:translate-y-0 active:scale-[0.99]",
                active
                  ? "border-primary/40 ring-2 ring-primary/15 shadow-md shadow-primary/10"
                  : "border-slate-200/70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-primary" : "text-slate-400",
                    )}
                  >
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-[#2D2D44] tabular-nums sm:text-3xl">
                    {card.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "bg-[#f3e0fb] text-primary",
                  )}
                >
                  <card.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    card.up
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-600",
                  )}
                >
                  {card.up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {card.delta}%
                </span>
                <span className="text-[11px] text-slate-400">{card.hint}</span>
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold",
                    active ? "text-primary" : "text-slate-300",
                  )}
                >
                  Open
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <section className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 lg:col-span-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-[#2D2D44]">
                    Career pipeline
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Portfolio stages vs alumni completions
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setTab("portfolio")}
                >
                  Review portfolios
                </Button>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineBars} barSize={28}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(193,71,233,0.06)" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {pipelineBars.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 lg:col-span-4">
              <h2 className="text-sm font-black text-[#2D2D44]">
                Alumni by program
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Completions across categories
              </p>
              <ul className="mt-4 space-y-3.5">
                {programBreakdown.length ? (
                  programBreakdown.map((row) => (
                    <li key={row.name}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-slate-600">
                          {row.name}
                        </span>
                        <span className="shrink-0 text-xs font-black tabular-nums text-[#2D2D44]">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#F7F6FB]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-[#5B5FEF]"
                          style={{ width: `${Math.max(row.pct, 6)}%` }}
                        />
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-10 text-center text-xs text-slate-400">
                    No alumni programs yet
                  </li>
                )}
              </ul>
            </section>
          </div>

          {/* Analytics + job feed — stacked cleanly on mobile to avoid overlap */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(45,45,68,0.06)] sm:p-6">
                <h2 className="text-sm font-black text-[#2D2D44]">
                  Portfolio mix
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Review status distribution
                </p>
                <div className="mt-2 flex h-[200px] items-center justify-center">
                  {(stats?.portfolioTotal ?? 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolioPie}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {portfolioPie.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-slate-400">No submissions yet</p>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { label: "Pending", color: PIE_COLORS.pending },
                    { label: "Needs changes", color: PIE_COLORS.needs },
                    { label: "Reviewed", color: PIE_COLORS.reviewed },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: item.color }}
                      />
                      {item.label}
                    </span>
                  ))}
                </div>
              </section>

              <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(45,45,68,0.06)] sm:p-6">
                <img
                  src="/Banner.jpg"
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08]"
                />
                <div className="relative">
                  <h2 className="text-sm font-black text-[#2D2D44]">
                    Channel readiness
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Alumni channels across communities
                  </p>
                  <div className="relative mx-auto mt-4 flex h-36 w-56 items-end justify-center">
                    <svg
                      className="h-full w-full"
                      viewBox="0 0 160 90"
                      aria-hidden
                    >
                      <path
                        d="M 20 80 A 56 56 0 0 1 140 80"
                        fill="none"
                        stroke="#F3E8FF"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 20 80 A 56 56 0 0 1 140 80"
                        fill="none"
                        stroke="#c147e9"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={gaugeC}
                        strokeDashoffset={gaugeOffset}
                      />
                    </svg>
                    <div className="absolute inset-x-0 bottom-1 text-center">
                      <p className="text-2xl font-black tabular-nums text-[#2D2D44]">
                        {stats?.alumniChannelsReady ?? 0}
                      </p>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Ready · {channelReadyPct}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-[#FFF1EB] px-3 py-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Ready
                      </p>
                      <p className="text-sm font-black text-[#C45C40] tabular-nums">
                        {stats?.alumniChannelsReady ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#FFFBEB] px-3 py-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Missing
                      </p>
                      <p className="text-sm font-black text-[#B45309] tabular-nums">
                        {stats?.alumniChannelsMissing ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className="relative z-0 min-w-0 overflow-visible rounded-[1.75rem] border border-slate-200/80 bg-[#F5F6F8] p-4 pb-8 shadow-[0_10px_30px_rgba(45,45,68,0.06)] sm:p-6 sm:pb-10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black text-[#2D2D44]">
                    Live job feed
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    What graduates see — tap side cards or arrows to flip
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full bg-white"
                  onClick={() => setTab("jobs")}
                >
                  See all
                </Button>
              </div>
              {jobsLoading ? (
                <div className="flex items-center gap-2 py-10 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading feed…
                </div>
              ) : jobs[0] ? (
                <div className="relative z-0 mx-auto max-w-lg overflow-visible">
                  <JobMatchCard jobs={jobs.slice(0, 5)} stacked />
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-slate-400">
                  No jobs in feed
                </p>
              )}
            </section>

            {/* Recent alumni — blended with job-card warm / white language */}
            <section className="relative z-0 min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[#F5F6F8] p-4 shadow-[0_10px_30px_rgba(45,45,68,0.06)] sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-[#2D2D44]">
                    Recent alumni
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Latest program completions
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[#c147e9] hover:bg-[#9b2ec4]"
                  onClick={() => setTab("alumni")}
                >
                  View all
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
              <ul className="space-y-3">
                {(monitor?.alumni || []).slice(0, 5).map((a, i) => {
                  const warm = [
                    {
                      logo: "bg-[#E07A5F]",
                      soft: "bg-[#FFF1EB]",
                      match: "text-[#C45C40]",
                      border: "border-[#E07A5F]/35",
                    },
                    {
                      logo: "bg-[#D97706]",
                      soft: "bg-[#FFFBEB]",
                      match: "text-[#B45309]",
                      border: "border-[#F59E0B]/40",
                    },
                    {
                      logo: "bg-[#C2410C]",
                      soft: "bg-[#FFF7ED]",
                      match: "text-[#9A3412]",
                      border: "border-[#FB923C]/40",
                    },
                    {
                      logo: "bg-[#c147e9]",
                      soft: "bg-[#f3e0fb]",
                      match: "text-[#9b2ec4]",
                      border: "border-[#c147e9]/35",
                    },
                  ][i % 4];
                  const program = a.programs[0]?.name || "Program";
                  return (
                    <li
                      key={a.studentId}
                      className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap gap-1.5">
                          <span className="rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {program}
                          </span>
                          {a.programs[1]?.name ? (
                            <span className="rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              +{a.programs.length - 1}
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[10px] font-bold",
                            warm.border,
                            warm.match,
                          )}
                        >

                          {a.isActive === false ? "Off" : "Active"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-start gap-3">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm",
                            warm.logo,
                          )}
                        >
                          {initials(a.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-black tracking-tight text-[#111827]">
                            {a.name}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {a.email}
                          </p>
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                            Completed {a.programs.map((p) => p.name).join(" · ")}
                            {a.latestCompletedAt
                              ? ` · ${formatDistanceToNow(new Date(a.latestCompletedAt), { addSuffix: true })}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2.5 text-center text-[11px] font-bold",
                            warm.soft,
                            warm.match,
                          )}
                        >
                          {a.programs.length} program
                          {a.programs.length === 1 ? "" : "s"}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTab("alumni")}
                          className="rounded-2xl bg-[#F3F4F6] px-3 py-2.5 text-center text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                          Open roster
                        </button>
                      </div>
                    </li>
                  );
                })}
                {!monitor?.alumni?.length ? (
                  <li className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
                    No alumni yet — appears when students complete a program
                  </li>
                ) : null}
              </ul>
            </section>
          </div>
        </>
      ) : null}

      {tab === "alumni" ? (
        <ul className="space-y-2">
          {(monitor?.alumni || []).map((a) => (
            <li
              key={a.studentId}
              className="rounded-[1.35rem] border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3e0fb] text-[11px] font-black text-primary">
                  {initials(a.name)}
                </span>
                <p className="text-sm font-black text-slate-900">{a.name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    a.isActive === false
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {a.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{a.email}</p>
              <p className="mt-1 text-xs text-slate-600">
                {a.programs.map((p) => p.name).join(" · ")}
              </p>
              {a.latestCompletedAt ? (
                <p className="mt-1 text-[11px] text-slate-400">
                  Latest completion{" "}
                  {formatDistanceToNow(new Date(a.latestCompletedAt), {
                    addSuffix: true,
                  })}
                </p>
              ) : null}
            </li>
          ))}
          {!monitor?.alumni?.length ? (
            <li className="rounded-[1.35rem] border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
              No alumni yet — appears when students complete a program
            </li>
          ) : null}
        </ul>
      ) : null}

      {tab === "jobs" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-[#2D2D44]">Job matches</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full lg:hidden"
              onClick={() => setTab("overview")}
            >
              See less
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200/70 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-4">
            <select
              value={jobCategoryId}
              onChange={(e) => setJobCategoryId(e.target.value)}
              className="h-14 min-w-0 flex-1 rounded-full border border-slate-200 bg-[#F7F6FB] py-3 pl-6 pr-10 text-sm font-semibold leading-normal text-slate-700 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
            >
              <option value="">All active categories</option>
              {platformCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Input
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Filter roles…"
              className="h-14 flex-1 rounded-full border-slate-200 bg-[#F7F6FB] px-6 py-3.5 text-sm leading-normal"
            />
            <Button
              type="button"
              className="h-14 shrink-0 rounded-full px-7"
              disabled={jobsLoading}
              onClick={() =>
                void loadJobs(jobSearch, jobCategoryId || undefined)
              }
            >
              {jobsLoading ? "Loading…" : "Refresh feed"}
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Matching{" "}
            {matchedFrom.length
              ? matchedFrom.join(", ")
              : "active course categories"}
            .{" "}
            {attribution ||
              "Jobs sourced from Remotive and Arbeitnow for graduate matching."}
          </p>
          <JobMatchGrid
            jobs={jobs}
            loading={jobsLoading}
            stackSize={5}
            pageSize={2}
            emptyMessage="No jobs matched these categories right now"
          />
        </div>
      ) : null}

      {tab === "portfolio" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              ["", "All"],
              ["pending", "Pending"],
              ["needs_changes", "Needs changes"],
              ["reviewed", "Reviewed"],
            ].map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setPortfolioFilter(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold",
                  portfolioFilter === value
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 shadow-sm",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li
                key={r._id}
                className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-slate-900">{r.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    {r.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {r.student?.name || "Student"}
                  {r.category?.name ? ` · ${r.category.name}` : ""}
                  {r.reviewer?.name ? ` · reviewed by ${r.reviewer.name}` : ""}
                </p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Open portfolio
                  <ExternalLink className="h-3 w-3" />
                </a>
                {r.feedback ? (
                  <p className="mt-2 rounded-xl bg-[#F7F5FB] px-3 py-2 text-sm text-slate-700">
                    {r.feedback}
                  </p>
                ) : null}
                {r.status !== "reviewed" ? (
                  <>
                    <Textarea
                      className="mt-3 min-h-20 rounded-xl"
                      placeholder="Write feedback…"
                      value={feedback[r._id] || ""}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          [r._id]: e.target.value,
                        }))
                      }
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        disabled={busyId === r._id}
                        onClick={() => void review(r._id, "reviewed")}
                      >
                        Mark reviewed
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={busyId === r._id}
                        onClick={() => void review(r._id, "needs_changes")}
                      >
                        Needs changes
                      </Button>
                    </div>
                  </>
                ) : null}
              </li>
            ))}
            {!reviews.length ? (
              <li className="rounded-[1.5rem] border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                No portfolio submissions
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {tab === "community" ? (
        <ul className="space-y-2">
          {(monitor?.alumniChannels || []).map((c) => (
            <li
              key={c.communityId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-black text-slate-900">
                  {c.categoryName}
                </p>
                <p className="text-xs text-slate-500">
                  {c.memberCount} community members
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                  c.hasAlumniChannel
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {c.hasAlumniChannel ? "Alumni channel ready" : "Missing channel"}
              </span>
            </li>
          ))}
          {!monitor?.alumniChannels?.length ? (
            <li className="rounded-[1.35rem] border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
              No communities found
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
