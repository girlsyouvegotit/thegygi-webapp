import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Eye,
  EyeOff,
  ExternalLink,
    MessageCircle,
  MessageSquareReply,
  Quote,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { TablePageSkeleton } from "@/components/loading/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAdminBasePath } from "@/hooks/useAdminPath";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingDelete =
  | { kind: "story"; id: string; label: string }
  | { kind: "comment"; id: string; label: string }
  | null;

type AdminComment = {
  _id: string;
  testimonialId: string;
  testimonialName?: string;
  authorName: string;
  body: string;
  isHidden: boolean;
  createdAt: string;
  adminReply?: {
    body: string;
    authorName: string;
    repliedAt: string;
  } | null;
};

type AdminStory = {
  _id: string;
  name: string;
  role: string;
  body: string;
  country: string;
  flag?: string;
  initials?: string;
  accent?: string;
  accentLight?: string;
  status: string;
  studentUser?: { name?: string; email?: string } | null;
  student?: string | null;
  createdAt?: string;
};

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "GY";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const AVATAR_TONES = [
  "bg-[#c147e9] text-white",
  "bg-[#8B5CF6] text-white",
  "bg-[#EC4899] text-white",
  "bg-[#6366F1] text-white",
  "bg-[#F3E8FF] text-[#7C3AED]",
  "bg-[#FCE7F3] text-[#BE185D]",
];

export default function TestimonialCommentsPage() {
  const base = useAdminBasePath();
  const [tab, setTab] = useState<"stories" | "comments">("stories");
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterId, setFilterId] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    const { data } = await api.get("/testimonials");
    setStories((data.data?.testimonials || []) as AdminStory[]);
  }, []);

  const loadComments = useCallback(async () => {
    const { data } = await api.get("/testimonials/comments", {
      params: filterId ? { testimonialId: filterId } : undefined,
    });
    setComments((data.data?.comments || []) as AdminComment[]);
  }, [filterId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadStories(), loadComments()]);
    } catch {
      toast.error("Failed to load testimonial data");
    } finally {
      setLoading(false);
    }
  }, [loadStories, loadComments]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const live = stories.filter((s) => s.status === "approved");
    const unpublished = stories.filter((s) => s.status !== "approved");
    const studentStories = stories.filter((s) => Boolean(s.studentUser || s.student));
    const classic = stories.filter((s) => !s.studentUser && !s.student);
    const hiddenComments = comments.filter((c) => c.isHidden);
    const unreplied = comments.filter((c) => !c.adminReply && !c.isHidden);
    const livePct = stories.length
      ? Math.round((live.length / stories.length) * 100)
      : 0;
    return {
      total: stories.length,
      live: live.length,
      unpublished: unpublished.length,
      studentStories: studentStories.length,
      classic: classic.length,
      comments: comments.length,
      hiddenComments: hiddenComments.length,
      unreplied: unreplied.length,
      livePct,
    };
  }, [stories, comments]);

  const recentAuthors = useMemo(() => {
    return [...stories]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [stories]);

  const spotlight = useMemo(() => {
    if (activeStoryId) {
      const found = stories.find((s) => s._id === activeStoryId);
      if (found) return found;
    }
    const studentFirst = [...stories]
      .filter((s) => Boolean(s.studentUser || s.student))
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })[0];
    return studentFirst || stories[0] || null;
  }, [stories, activeStoryId]);

  const mixBars = useMemo(() => {
    const max = Math.max(stats.classic, stats.studentStories, 1);
    return [
      {
        label: "Classic",
        value: stats.classic,
        height: Math.max(18, Math.round((stats.classic / max) * 100)),
        tone: "from-[#c147e9] to-[#a21caf]",
      },
      {
        label: "Students",
        value: stats.studentStories,
        height: Math.max(18, Math.round((stats.studentStories / max) * 100)),
        tone: "from-[#e9d5ff] to-[#f5d0fe]",
      },
      {
        label: "Live",
        value: stats.live,
        height: Math.max(18, Math.round((stats.live / max) * 100)),
        tone: "from-[#8B5CF6] to-[#6366F1]",
      },
      {
        label: "Hidden",
        value: stats.unpublished,
        height: Math.max(
          12,
          Math.round((stats.unpublished / max) * 100) || 12,
        ),
        tone: "from-[#F3E8FF] to-[#FCE7F3]",
      },
    ];
  }, [stats]);

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    try {
      await api.patch(`/testimonials/${id}/status`, { status });
      toast.success(
        status === "approved" ? "Story is live" : "Story removed from home",
      );
      await loadStories();
    } catch {
      toast.error("Could not update story");
    } finally {
      setBusyId(null);
    }
  };

  const removeStory = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/testimonials/${id}`);
      setStories((prev) => prev.filter((s) => s._id !== id));
      setComments((prev) => prev.filter((c) => c.testimonialId !== id));
      toast.success("Testimonial deleted");
      setPendingDelete(null);
      if (activeStoryId === id) setActiveStoryId(null);
      await loadStories().catch(() => undefined);
    } catch {
      toast.error("Could not delete story");
    } finally {
      setBusyId(null);
    }
  };

  const setHidden = async (id: string, isHidden: boolean) => {
    setBusyId(id);
    try {
      const { data } = await api.patch(
        `/testimonials/comments/${id}/visibility`,
        { isHidden },
      );
      const updated = data.data?.comment as AdminComment;
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...updated } : c)),
      );
      toast.success(isHidden ? "Comment hidden" : "Comment visible again");
    } catch {
      toast.error("Could not update visibility");
    } finally {
      setBusyId(null);
    }
  };

  const removeComment = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/testimonials/comments/${id}`);
      setComments((prev) => prev.filter((c) => c._id !== id));
      setPendingDelete(null);
      toast.success("Comment deleted");
    } catch {
      toast.error("Could not delete comment");
    } finally {
      setBusyId(null);
    }
  };

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "story") void removeStory(pendingDelete.id);
    else void removeComment(pendingDelete.id);
  };

  const reply = async (id: string) => {
    const body = (replyDrafts[id] || "").trim();
    if (body.length < 2) {
      toast.error("Write a short reply first");
      return;
    }
    setBusyId(id);
    try {
      const { data } = await api.post(`/testimonials/comments/${id}/reply`, {
        body,
      });
      const updated = data.data?.comment as AdminComment;
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, ...updated } : c)),
      );
      setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
      toast.success("Reply posted");
    } catch {
      toast.error("Could not post reply");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-primary/70 uppercase">
            Admin · Home impact
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Testimonials
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-500">
            Curate student stories, keep the home carousel honest, and moderate
            public comments — all in one board.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-black/5 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setTab("stories")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition",
                tab === "stories"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              Stories · {stats.total}
            </button>
            <button
              type="button"
              onClick={() => setTab("comments")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition",
                tab === "comments"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              Comments · {stats.comments}
            </button>
          </div>
          {tab === "comments" ? (
            <select
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="h-10 rounded-full border border-black/5 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm"
            >
              <option value="">All stories</option>
              {stories.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-black/5 bg-white shadow-sm"
            onClick={() => void load()}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bento overview */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6 xl:grid-cols-12 xl:gap-4">
        {/* Hero overview — GYGI banner + impact copy */}
        <section className="relative overflow-hidden rounded-[2rem] text-white shadow-lg shadow-primary/20 md:col-span-6 xl:col-span-5">
          <img
            src="/groupies.jpg"
            alt="GYGI learners together"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/gygishot.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a0b3d]/95 via-[#4c1d6d]/85 to-[#c147e9]/70" />
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.35), transparent 40%)",
            }}
          />
          <div className="relative flex h-full min-h-[240px] flex-col p-5 xl:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-white/70 uppercase">
                  Home carousel
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                  Impact stories
                  <br />
                  on gygi.org
                </h2>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Quote className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
              {stats.live} live · {stats.studentStories} student-submitted ·{" "}
              {stats.classic} featured classics
            </p>
            <div className="mt-auto flex items-end justify-between gap-3 pt-8">
              <div className="flex items-center">
                {recentAuthors.map((a, i) => (
                  <div
                    key={a._id}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 text-[10px] font-black shadow-sm",
                      AVATAR_TONES[i % AVATAR_TONES.length],
                      i > 0 && "-ml-2.5",
                    )}
                    title={a.name}
                  >
                    {a.initials || initialsFrom(a.name)}
                  </div>
                ))}
                {stats.total > recentAuthors.length ? (
                  <div className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/30 bg-white text-[10px] font-black text-slate-900">
                    +{stats.total - recentAuthors.length}
                  </div>
                ) : null}
              </div>
              <a
                href="https://gygi.org/#testimonials"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-white/90"
              >
                View home
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Mix chart card */}
        <section className="rounded-[2rem] border border-black/[0.04] bg-white p-5 shadow-sm md:col-span-3 xl:col-span-4 xl:p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                Story mix
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">
                Classic vs students
              </h3>
            </div>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-6 flex h-36 items-end justify-between gap-3 px-1">
            {mixBars.map((bar) => (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs font-black tabular-nums text-slate-700">
                  {bar.value}
                </span>
                <div className="relative flex h-28 w-full items-end justify-center">
                  <div
                    className={cn(
                      "w-[70%] max-w-10 rounded-full bg-gradient-to-t shadow-inner",
                      bar.tone,
                    )}
                    style={{ height: `${bar.height}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Student stories publish live by default. Unpublish any card that
            shouldn’t appear on the home page.
          </p>
        </section>

        {/* Mini stats stack */}
        <div className="grid grid-cols-2 gap-3 md:col-span-3 md:grid-cols-1 xl:col-span-3">
          <button
            type="button"
            onClick={() => setTab("stories")}
            className="group flex min-h-[132px] flex-col rounded-[2rem] border border-black/[0.04] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E8FF] text-primary">
                <Quote className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold tracking-wide text-emerald-600 uppercase">
                Live
              </span>
            </div>
            <p className="mt-auto pt-6 text-4xl font-black tabular-nums tracking-tight text-slate-900">
              {stats.live}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              On home page
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTab("comments")}
            className="group flex min-h-[132px] flex-col rounded-[2rem] bg-gradient-to-br from-[#F3E8FF] via-[#FDF4FF] to-[#FCE7F3] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <MessageCircle className="h-4 w-4" />
              </span>
              {stats.unreplied > 0 ? (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                  {stats.unreplied} open
                </span>
              ) : (
                <span className="text-[10px] font-bold tracking-wide text-primary uppercase">
                  Inbox
                </span>
              )}
            </div>
            <p className="mt-auto pt-6 text-4xl font-black tabular-nums tracking-tight text-slate-900">
              {stats.comments}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Public comments
            </p>
          </button>
        </div>

        {/* Health gauge */}
        <section className="rounded-[2rem] border border-black/[0.04] bg-white p-5 shadow-sm md:col-span-3 xl:col-span-3 xl:p-6">
          <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
            Publish health
          </p>
          <div className="relative mx-auto mt-4 flex h-36 w-36 items-end justify-center">
            <svg viewBox="0 0 120 70" className="absolute inset-x-0 top-0 h-full w-full">
              <path
                d="M10 60 A50 50 0 0 1 110 60"
                fill="none"
                stroke="#F3E8FF"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M10 60 A50 50 0 0 1 110 60"
                fill="none"
                stroke="#c147e9"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(stats.livePct / 100) * 157} 157`}
              />
            </svg>
            <div className="relative mb-1 text-center">
              <p className="text-3xl font-black tabular-nums text-slate-900">
                {stats.livePct}%
              </p>
              <p className="text-[11px] font-semibold text-slate-400">live</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-[#F8F7FC] px-2 py-2">
              <p className="text-sm font-black text-slate-900">
                {stats.unpublished}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                Unpublished
              </p>
            </div>
            <div className="rounded-2xl bg-[#F8F7FC] px-2 py-2">
              <p className="text-sm font-black text-slate-900">
                {stats.hiddenComments}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                Hidden notes
              </p>
            </div>
          </div>
        </section>

        {/* Spotlight quote */}
        <section className="relative overflow-hidden rounded-[2rem] border border-black/[0.04] bg-white shadow-sm md:col-span-3 xl:col-span-4">
          {spotlight ? (
            <div
              className="flex h-full min-h-[240px] flex-col p-5 xl:p-6"
              style={{
                background: `linear-gradient(160deg, ${spotlight.accentLight || "#F3E8FF"} 0%, #ffffff 55%)`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                  Spotlight
                </p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: spotlight.accent || "#c147e9" }}
                >
                  {spotlight.studentUser || spotlight.student
                    ? "Student"
                    : "Featured"}
                </span>
              </div>
              <Quote
                className="mt-4 h-6 w-6"
                style={{ color: spotlight.accent || "#c147e9" }}
              />
              <p className="mt-3 line-clamp-4 text-base font-semibold leading-relaxed text-slate-800">
                “{spotlight.body}”
              </p>
              <div className="mt-auto flex items-center gap-3 pt-5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black text-white"
                  style={{ background: spotlight.accent || "#c147e9" }}
                >
                  {spotlight.initials || initialsFrom(spotlight.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {spotlight.name}{" "}
                    <span className="font-medium text-slate-400">
                      {spotlight.flag || ""}
                    </span>
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {spotlight.role} · {spotlight.country}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center p-6 text-sm text-slate-400">
              No stories yet
            </div>
          )}
        </section>

        {/* Activity / list pane */}
        <section className="rounded-[2rem] border border-black/[0.04] bg-[#F7F5FB] p-3 shadow-sm md:col-span-6 xl:col-span-5 xl:p-4">
          <div className="mb-3 flex items-center justify-between px-2 pt-1">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                {tab === "stories" ? "Story queue" : "Comment inbox"}
              </p>
              <h3 className="text-base font-black text-slate-900">
                {tab === "stories"
                  ? "Manage home cards"
                  : "Moderate public replies"}
              </h3>
            </div>
          </div>

          {tab === "stories" ? (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {stories.map((s, index) => {
                const busy = busyId === s._id;
                const studentSubmitted = Boolean(s.studentUser || s.student);
                const active = activeStoryId === s._id;
                const accentRow = index % 3 === 0;
                return (
                  <li key={s._id}>
                    <div
                      className={cn(
                        "rounded-[1.35rem] p-3 transition",
                        accentRow
                          ? "bg-gradient-to-r from-[#c147e9] to-[#a21caf] text-white shadow-md shadow-primary/20"
                          : "bg-white text-slate-900 shadow-sm",
                        active && !accentRow && "ring-2 ring-primary/30",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveStoryId(s._id)}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[11px] font-black",
                            accentRow
                              ? "bg-white/20 text-white"
                              : "text-white",
                          )}
                          style={
                            accentRow
                              ? undefined
                              : { background: s.accent || "#c147e9" }
                          }
                        >
                          {s.initials || initialsFrom(s.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p
                              className={cn(
                                "truncate text-sm font-black",
                                accentRow ? "text-white" : "text-slate-900",
                              )}
                            >
                              {s.name}
                            </p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                                accentRow
                                  ? "bg-white/20 text-white"
                                  : s.status === "approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-800",
                              )}
                            >
                              {s.status}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                                accentRow
                                  ? "bg-white/15 text-white/90"
                                  : studentSubmitted
                                    ? "bg-primary/10 text-primary"
                                    : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {studentSubmitted ? "Student" : "Featured"}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "mt-0.5 truncate text-xs",
                              accentRow ? "text-white/75" : "text-slate-500",
                            )}
                          >
                            {s.role} · {s.country} {s.flag || ""}
                          </p>
                          <p
                            className={cn(
                              "mt-1 line-clamp-2 text-xs leading-relaxed",
                              accentRow ? "text-white/85" : "text-slate-600",
                            )}
                          >
                            {s.body}
                          </p>
                        </div>
                      </button>
                      <div className="mt-3 flex flex-wrap items-center gap-2 pl-14">
                        {s.status !== "approved" ? (
                          <Button
                            type="button"
                            size="sm"
                            className={cn(
                              "h-8 rounded-full text-xs",
                              accentRow &&
                                "bg-white text-slate-900 hover:bg-white/90",
                            )}
                            disabled={busy}
                            onClick={() => void setStatus(s._id, "approved")}
                          >
                            Publish
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant={accentRow ? "secondary" : "outline"}
                            className={cn(
                              "h-8 rounded-full text-xs",
                              accentRow &&
                                "border-0 bg-white/15 text-white hover:bg-white/25",
                            )}
                            disabled={busy}
                            onClick={() => void setStatus(s._id, "rejected")}
                          >
                            Unpublish
                          </Button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setPendingDelete({
                              kind: "story",
                              id: s._id,
                              label: s.name,
                            })
                          }
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
                            accentRow
                              ? "bg-white/15 text-white hover:bg-white/25"
                              : "bg-rose-50 text-rose-600 hover:bg-rose-100",
                          )}
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
              {!stories.length ? (
                <li className="rounded-[1.35rem] bg-white py-12 text-center text-sm text-slate-400">
                  No testimonials yet
                </li>
              ) : null}
            </ul>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {comments.map((c, index) => {
                const busy = busyId === c._id;
                const accentRow = index % 4 === 0;
                return (
                  <li
                    key={c._id}
                    className={cn(
                      "rounded-[1.35rem] p-3",
                      accentRow
                        ? "bg-gradient-to-r from-[#7c3aed] to-[#c147e9] text-white shadow-md shadow-primary/20"
                        : "bg-white shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[11px] font-black",
                          accentRow
                            ? "bg-white/20 text-white"
                            : "bg-[#F3E8FF] text-primary",
                        )}
                      >
                        {initialsFrom(c.authorName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p
                            className={cn(
                              "text-sm font-black",
                              accentRow ? "text-white" : "text-slate-900",
                            )}
                          >
                            {c.authorName}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                              accentRow
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {c.testimonialName || "Story"}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                              accentRow
                                ? "bg-white/15 text-white"
                                : c.isHidden
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700",
                            )}
                          >
                            {c.isHidden ? "Hidden" : "Visible"}
                          </span>
                          <span
                            className={cn(
                              "ml-auto text-[10px]",
                              accentRow ? "text-white/70" : "text-slate-400",
                            )}
                          >
                            {formatDistanceToNow(new Date(c.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-1 text-sm leading-relaxed",
                            accentRow ? "text-white/90" : "text-slate-600",
                          )}
                        >
                          {c.body}
                        </p>
                        {c.adminReply ? (
                          <div
                            className={cn(
                              "mt-2 rounded-2xl px-3 py-2",
                              accentRow
                                ? "bg-white/15"
                                : "border border-primary/15 bg-primary/5",
                            )}
                          >
                            <p
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wide",
                                accentRow ? "text-white/80" : "text-primary",
                              )}
                            >
                              Reply · {c.adminReply.authorName}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 text-sm",
                                accentRow ? "text-white" : "text-slate-700",
                              )}
                            >
                              {c.adminReply.body}
                            </p>
                          </div>
                        ) : null}
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={replyDrafts[c._id] || ""}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [c._id]: e.target.value,
                              }))
                            }
                            placeholder="Write an admin reply…"
                            rows={2}
                            className={cn(
                              "min-h-14 rounded-xl text-sm",
                              accentRow &&
                                "border-white/20 bg-white/10 text-white placeholder:text-white/50",
                            )}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className={cn(
                                "h-8 rounded-full text-xs",
                                accentRow &&
                                  "bg-white text-slate-900 hover:bg-white/90",
                              )}
                              disabled={busy}
                              onClick={() => void reply(c._id)}
                            >
                              <MessageSquareReply className="mr-1.5 h-3.5 w-3.5" />
                              {c.adminReply ? "Update reply" : "Reply"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={accentRow ? "secondary" : "outline"}
                              className={cn(
                                "h-8 rounded-full text-xs",
                                accentRow &&
                                  "border-0 bg-white/15 text-white hover:bg-white/25",
                              )}
                              disabled={busy}
                              onClick={() => void setHidden(c._id, !c.isHidden)}
                            >
                              {c.isHidden ? (
                                <>
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  Unhide
                                </>
                              ) : (
                                <>
                                  <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                                  Hide
                                </>
                              )}
                            </Button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setPendingDelete({
                                  kind: "comment",
                                  id: c._id,
                                  label: c.authorName,
                                })
                              }
                              className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
                                accentRow
                                  ? "bg-white/15 text-white hover:bg-white/25"
                                  : "bg-rose-50 text-rose-600 hover:bg-rose-100",
                              )}
                              aria-label="Delete comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              {!comments.length ? (
                <li className="rounded-[1.35rem] bg-white py-12 text-center text-sm text-slate-400">
                  No comments yet
                </li>
              ) : null}
            </ul>
          )}
        </section>
      </div>

      <p className="text-xs text-slate-400">Path: {base}/testimonials</p>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !busyId) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="overflow-hidden rounded-3xl border-border p-0 shadow-2xl">
          <AlertDialogHeader className="bg-muted/30 p-6 text-left sm:text-left">
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-xl">
              {pendingDelete?.kind === "comment"
                ? "Delete this comment?"
                : "Delete this testimonial?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "comment" ? (
                <>
                  This permanently removes the comment from{" "}
                  <span className="font-semibold text-slate-700">
                    {pendingDelete.label}
                  </span>
                  . This cannot be undone.
                </>
              ) : (
                <>
                  This permanently removes{" "}
                  <span className="font-semibold text-slate-700">
                    {pendingDelete?.label}
                  </span>
                  ’s story from the home page, including its likes and comments.
                  This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-2">
            <AlertDialogCancel
              className="rounded-full"
              disabled={Boolean(busyId)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-rose-600 hover:bg-rose-700"
              disabled={Boolean(busyId)}
              onClick={(e) => {
                e.preventDefault();
                confirmPendingDelete();
              }}
            >
              {busyId ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
