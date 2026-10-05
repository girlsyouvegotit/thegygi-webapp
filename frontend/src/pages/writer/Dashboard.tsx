import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "@/lib/api";
import {
  FileText,
  PenLine,
  BookOpen,
  Eye,
  Archive,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  CircleDot,
  CheckCircle2,
  LayoutTemplate,
} from "lucide-react";
import { format, formatDistanceToNow, getDay, subDays, isAfter } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuthContext";
import { WriterDashboardSkeleton } from "@/components/loading/PageSkeleton";
import { cn } from "@/lib/utils";

interface Stats {
  counts: {
    draft: number;
    published: number;
    archived: number;
    total: number;
  };
  about: {
    status: string;
    updatedAt?: string;
    publishedAt?: string;
  } | null;
  recent: Array<{
    _id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
    publishedAt?: string;
  }>;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function statusProgress(status: string) {
  if (status === "published") return 100;
  if (status === "draft") return 55;
  return 30;
}

function statusTone(status: string) {
  if (status === "published")
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "draft") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function progressBarTone(status: string) {
  if (status === "published") return "bg-primary";
  if (status === "draft") return "bg-amber-400";
  return "bg-slate-300";
}

const WriterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/content/writer/dashboard");
      setStats(data.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const chartData = useMemo(() => {
    const recent = stats?.recent || [];
    const thisWeekStart = subDays(new Date(), 6);
    const lastWeekStart = subDays(new Date(), 13);

    const bucket = (from: Date, to: Date) => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      for (const post of recent) {
        const d = new Date(post.updatedAt);
        if (!isAfter(d, from) || isAfter(d, to)) continue;
        // JS getDay: 0 Sun … convert to Mon-first index
        const idx = (getDay(d) + 6) % 7;
        counts[idx] += 1;
      }
      return counts;
    };

    const thisWeek = bucket(thisWeekStart, new Date());
    const lastWeek = bucket(lastWeekStart, thisWeekStart);

    // Soft baseline so empty weeks still read as a chart
    return DAY_LABELS.map((day, i) => ({
      day,
      thisWeek: thisWeek[i] + (stats?.counts.published ? 0.2 : 0),
      lastWeek: lastWeek[i] + 0.15,
    }));
  }, [stats]);

  const recentPosts = stats?.recent || [];

  const publishRate =
    stats && stats.counts.total > 0
      ? Math.round((stats.counts.published / stats.counts.total) * 100)
      : 0;

  const draftRate =
    stats && stats.counts.total > 0
      ? Math.round((stats.counts.draft / stats.counts.total) * 100)
      : 0;

  const suggestions = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      body: string;
      href: string;
      badge?: string;
      when: string;
    }> = [];

    if ((stats?.counts.draft || 0) > 0) {
      items.push({
        id: "publish-drafts",
        title: "Publish a waiting draft",
        body: `You have ${stats!.counts.draft} draft${stats!.counts.draft === 1 ? "" : "s"} ready to review and go live.`,
        href: "/writer/posts?status=draft",
        badge: "New",
        when: "Now",
      });
    }

    if (stats?.about?.status !== "published") {
      items.push({
        id: "about-live",
        title: "Publish the About page",
        body: "Keep the public About page current so visitors see GYGI’s story.",
        href: "/writer/about",
        badge: stats?.about ? "Action" : "Setup",
        when: "Today",
      });
    }

    if ((stats?.counts.published || 0) === 0) {
      items.push({
        id: "first-post",
        title: "Ship your first blog story",
        body: "A published post helps the public Journal feel alive.",
        href: "/writer/posts/new",
        when: "This week",
      });
    } else {
      items.push({
        id: "new-story",
        title: "Start a fresh story",
        body: "Capture a classroom win, mentorship moment, or program update.",
        href: "/writer/posts/new",
        when: "Anytime",
      });
    }

    items.push({
      id: "preview-blog",
      title: "Preview the public blog",
      body: "See how stories look live on gygi.org’s Journal.",
      href: "/blog",
      when: "External",
    });

    return items.slice(0, 4);
  }, [stats]);

  if (loading) {
    return <WriterDashboardSkeleton />;
  }

  const aboutLive = stats?.about?.status === "published";
  const latestPost = stats?.recent?.[0];

  return (
    <div className="mx-auto max-w-[1600px] px-3 pt-5 pb-8 sm:px-5 sm:pt-6 lg:px-7">
      <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            Writing workspace
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1E1B4B] sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:w-auto sm:shrink-0">
          <Link
            to="/writer/about"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            Edit About
          </Link>
          <Link
            to="/writer/posts/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(193,71,233,0.35)] transition hover:brightness-105"
          >
            <PenLine className="h-4 w-4 shrink-0" />
            New post
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">

          {/* Focus cards — Blog + About */}
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to={
                latestPost
                  ? `/writer/posts/${latestPost._id}/edit`
                  : "/writer/posts/new"
              }
              className="group relative overflow-hidden rounded-[1.35rem] border border-violet-100 bg-gradient-to-br from-[#F8F0FF] to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  <FileText className="h-3 w-3" />
                  Blog posts
                </span>
                <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  Publish rate
                </span>
              </div>
              <p className="mt-4 text-5xl font-black tracking-tight text-[#1E1B4B]">
                {publishRate}
                <span className="text-2xl text-primary">%</span>
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                {stats?.counts.published ?? 0} published ·{" "}
                {stats?.counts.draft ?? 0} drafts ·{" "}
                {stats?.counts.total ?? 0} total stories in the Journal.
              </p>
              <p className="mt-5 text-xs font-medium text-slate-400">
                {latestPost
                  ? `Last updated ${formatDistanceToNow(new Date(latestPost.updatedAt), { addSuffix: true })}`
                  : "No posts yet — create your first story"}
              </p>
            </Link>

            <Link
              to="/writer/about"
              className="group relative overflow-hidden rounded-[1.35rem] border border-amber-100 bg-gradient-to-br from-[#FFF8EB] to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  <BookOpen className="h-3 w-3" />
                  About page
                </span>
                <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  Status
                </span>
              </div>
              <p className="mt-4 text-5xl font-black tracking-tight text-[#1E1B4B]">
                {aboutLive ? "Live" : "Draft"}
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                {aboutLive
                  ? "The public About page is published. Keep mission, impact, and team details current."
                  : "About content is not live yet. Review sections and publish when ready."}
              </p>
              <p className="mt-5 text-xs font-medium text-slate-400">
                {stats?.about?.updatedAt
                  ? `Last updated ${formatDistanceToNow(new Date(stats.about.updatedAt), { addSuffix: true })}`
                  : "No About page record yet"}
              </p>
            </Link>
          </div>

          {/* Publishing trend */}
          <section className="rounded-[1.35rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1E1B4B]">
                  Publishing activity
                </h2>
                <p className="text-xs text-slate-400">
                  Updates across your recent documents
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="mr-2 hidden items-center gap-3 text-[11px] font-medium text-slate-500 sm:flex">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    This week
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Last week
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRefreshing(true);
                    void load();
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-primary/30 hover:text-primary"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                  />
                  Refresh
                </button>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={28}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="thisWeek"
                    name="This week"
                    stroke="#c147e9"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#c147e9" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lastWeek"
                    name="Last week"
                    stroke="#FBBF24"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#FBBF24" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Recent documents */}
          <section className="rounded-[1.35rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#1E1B4B]">
                Recent documents
              </h2>
              <Link
                to="/writer/posts"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-12 text-center">
                <p className="text-sm text-slate-500">
                  No posts yet. Create your first story.
                </p>
                <Link
                  to="/writer/posts/new"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary"
                >
                  <PenLine className="h-4 w-4" />
                  New post
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentPosts.map((post) => {
                  const progress = statusProgress(post.status);
                  return (
                    <li key={post._id}>
                      <Link
                        to={`/writer/posts/${post._id}/edit`}
                        className="flex flex-col gap-3 py-3.5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-4"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#1E1B4B]">
                              {post.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              <span
                                className={cn(
                                  "mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
                                  statusTone(post.status),
                                )}
                              >
                                {post.status}
                              </span>
                              {format(new Date(post.updatedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full items-center gap-3 sm:w-44">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                progressBarTone(post.status),
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-bold text-slate-500 tabular-nums">
                            {progress}%
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right utility column */}
        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          {/* Tools */}
          <section className="rounded-[1.35rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-sm font-bold text-[#1E1B4B]">
              Quick tools
            </h2>
            <div className="space-y-1.5">
              {[
                {
                  label: "New blog post",
                  hint: "Start a Journal story",
                  href: "/writer/posts/new",
                  icon: PenLine,
                  meta: "+ New",
                },
                {
                  label: "Edit About page",
                  hint: "Mission, impact, team",
                  href: "/writer/about",
                  icon: BookOpen,
                  meta: aboutLive ? "Live" : "Draft",
                },
                {
                  label: "All posts",
                  hint: "Manage drafts & live",
                  href: "/writer/posts",
                  icon: LayoutTemplate,
                  meta: `${stats?.counts.total ?? 0}`,
                },
                {
                  label: "Public blog",
                  hint: "Open live Journal",
                  href: "/blog",
                  icon: ExternalLink,
                  meta: "↗",
                  external: true,
                },
              ].map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  onClick={() => {
                    if (tool.external) window.open(tool.href, "_blank");
                    else navigate(tool.href);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition hover:bg-[#FAF5FF]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <tool.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1E1B4B]">
                      {tool.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {tool.hint}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-primary">
                    {tool.meta}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="rounded-[1.35rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-sm font-bold text-[#1E1B4B]">
              Content stats
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Published",
                  value: stats?.counts.published ?? 0,
                  icon: Eye,
                  bar: "bg-primary",
                },
                {
                  label: "Drafts",
                  value: stats?.counts.draft ?? 0,
                  icon: FileText,
                  bar: "bg-amber-400",
                },
                {
                  label: "Archived",
                  value: stats?.counts.archived ?? 0,
                  icon: Archive,
                  bar: "bg-slate-300",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-100 bg-[#FAFAFC] p-3"
                >
                  <div className={cn("mb-2 h-1 w-8 rounded-full", s.bar)} />
                  <s.icon className="mb-2 h-3.5 w-3.5 text-slate-400" />
                  <p className="text-lg font-black text-[#1E1B4B] tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-[#FAF5FF] px-3 py-2.5">
              <p className="text-[11px] font-semibold text-primary">
                Draft share · {draftRate}%
              </p>
              <p className="text-[11px] text-slate-500">
                Keep polishing drafts before they go live on the Journal.
              </p>
            </div>
          </section>

          {/* Suggestions */}
          <section className="rounded-[1.35rem] border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1E1B4B]">Suggestions</h2>

            </div>
            <ul className="space-y-3">
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-[#FAFAFC] p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#1E1B4B]">
                          {item.title}
                        </p>
                        {item.badge && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {item.body}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-slate-400">
                          {item.when}
                        </span>
                        <Link
                          to={item.href}
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm ring-1 ring-slate-200 transition hover:ring-primary/30"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default WriterDashboard;
