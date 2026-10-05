import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
    MessageCircle,
  Rocket,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import JobMatchGrid from "@/components/jobs/JobMatchGrid";

type AlumniStatus = {
  isAlumni: boolean;
  completedCount: number;
  categories: Array<{
    enrollmentId: string;
    categoryId: string;
    name: string;
    completedAt?: string;
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
  source: "remotive" | "arbeitnow";
  publishedAt?: string;
  companyLogo?: string;
  matchedCategories?: string[];
};

type PortfolioRow = {
  _id: string;
  title: string;
  url: string;
  notes?: string;
  status: "pending" | "reviewed" | "needs_changes";
  feedback?: string;
  createdAt: string;
  category?: { name?: string } | null;
};

type Tab = "overview" | "jobs" | "portfolio" | "community" | "mentorship";

export default function AfterGraduationPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "overview";
  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    if (next === "overview") p.delete("tab");
    else p.set("tab", next);
    setParams(p, { replace: true });
  };

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AlumniStatus | null>(null);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobCategoryId, setJobCategoryId] = useState("");
  const [attribution, setAttribution] = useState("");
  const [matchedFrom, setMatchedFrom] = useState<string[]>([]);
  const [reviews, setReviews] = useState<PortfolioRow[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/post-program/status");
      setStatus(data.data as AlumniStatus);
    } catch {
      toast.error("Could not load after-graduation status");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobs = useCallback(
    async (search?: string, categoryId?: string) => {
      setJobsLoading(true);
      try {
        const { data } = await api.get("/post-program/jobs", {
          params: {
            search: search || undefined,
            categoryId: categoryId || undefined,
            limit: 24,
          },
        });
        setJobs((data.data?.jobs || []) as CareerJob[]);
        setAttribution(data.data?.attribution || "");
        setMatchedFrom(
          (data.data?.matchedFromCategories as string[]) || [],
        );
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Could not load jobs");
      } finally {
        setJobsLoading(false);
      }
    },
    [],
  );

  const loadPortfolio = useCallback(async () => {
    try {
      const { data } = await api.get("/post-program/portfolio");
      setReviews((data.data?.reviews || []) as PortfolioRow[]);
    } catch {
      /* locked until alumni */
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!status?.isAlumni) return;
    if (tab === "jobs") void loadJobs(undefined, jobCategoryId || undefined);
    if (tab === "portfolio") void loadPortfolio();
  }, [status?.isAlumni, tab, loadJobs, loadPortfolio, jobCategoryId]);

  const submitPortfolio = async () => {
    setSaving(true);
    try {
      await api.post("/post-program/portfolio", {
        title: title.trim(),
        url: url.trim(),
        notes: notes.trim() || undefined,
        categoryId: status?.categories[0]?.categoryId,
      });
      toast.success("Portfolio submitted for review");
      setTitle("");
      setUrl("");
      setNotes("");
      await loadPortfolio();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Could not submit portfolio");
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(
    () =>
      [
        { id: "overview" as const, label: "Overview", icon: Rocket },
        { id: "jobs" as const, label: "Jobs", icon: Briefcase },
        { id: "portfolio" as const, label: "Portfolio", icon: Briefcase },
        { id: "community" as const, label: "Alumni", icon: Users },
        { id: "mentorship" as const, label: "Mentorship", icon: GraduationCap },
      ] as const,
    [],
  );

  if (loading) {
    return <PageListSkeleton />;
  }

  if (!status?.isAlumni) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Rocket className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          After Graduation unlocks next
        </h1>
        <p className="text-sm leading-relaxed text-slate-500">
          Finish a program to unlock alumni community, automatic job matches,
          portfolio reviews, and continued mentorship.
        </p>
        <Button asChild className="rounded-full">
          <Link to="/my-learning">Go to My Learning</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2a0b3d] via-[#4c1d6d] to-[#c147e9] p-6 text-white shadow-lg shadow-primary/20 sm:p-8">
        <p className="text-[11px] font-bold tracking-[0.16em] text-white/70 uppercase">
          Post-program · GYGI
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          After Graduation
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
          You completed {status.completedCount} program
          {status.completedCount === 1 ? "" : "s"}. Keep growing with alumni
          community, job matches, portfolio reviews, and mentor support.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {status.categories.map((c) => (
            <span
              key={c.enrollmentId}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold"
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition",
              tab === t.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-50",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "Alumni Community",
              body: "Join the alumni channel in your program community for career tips and wins.",
              cta: "Open community",
              onClick: () => setTab("community"),
              icon: Users,
            },
            {
              title: "Job Placement",
              body: "Auto-fetched remote tech roles matched to your completed programs.",
              cta: "Browse jobs",
              onClick: () => setTab("jobs"),
              icon: Briefcase,
            },
            {
              title: "Portfolio Reviews",
              body: "Submit your portfolio link and get mentor/admin feedback.",
              cta: "Submit portfolio",
              onClick: () => setTab("portfolio"),
              icon: Briefcase,
            },
            {
              title: "Continued Mentorship",
              body: "Your mentor support continues with alumni career check-ins.",
              cta: "Open mentorship",
              onClick: () => setTab("mentorship"),
              icon: GraduationCap,
            },
          ].map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              className="rounded-[1.75rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <card.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-black text-slate-900">
                {card.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {card.body}
              </p>
              <span className="mt-4 inline-flex text-xs font-bold text-primary">
                {card.cta} →
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {tab === "jobs" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200/70 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-4">
            {(status?.categories?.length || 0) > 1 ? (
              <select
                value={jobCategoryId}
                onChange={(e) => setJobCategoryId(e.target.value)}
                className="h-14 min-w-0 flex-1 rounded-full border border-slate-200 bg-[#F7F6FB] py-3 pl-6 pr-10 text-sm font-semibold leading-normal text-slate-700 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
              >
                <option value="">All completed programs</option>
                {status?.categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Input
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search roles, e.g. frontend, design, data…"
              className="h-14 flex-1 rounded-full border-slate-200 bg-[#F7F6FB] px-6 py-3.5 text-sm leading-normal"
            />
            <Button
              type="button"
              className="h-14 shrink-0 rounded-full px-7"
              onClick={() =>
                void loadJobs(jobSearch, jobCategoryId || undefined)
              }
              disabled={jobsLoading}
            >
              {jobsLoading ? "Refreshing…" : "Refresh matches"}
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Matched to your{" "}
            {matchedFrom.length
              ? matchedFrom.join(", ")
              : "completed programs"}
            .{" "}
            {attribution ||
              "Jobs sourced from Remotive and Arbeitnow (free public APIs)."}
          </p>
          <JobMatchGrid
            jobs={jobs}
            loading={jobsLoading}
            stackSize={5}
            pageSize={2}
            emptyMessage="No matches for these programs right now — try another keyword."
          />
        </div>
      ) : null}

      {tab === "portfolio" ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-3 rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-black text-slate-900">
              Submit for review
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="ptitle">Title</Label>
              <Input
                id="ptitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My GYGI portfolio"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purl">Portfolio URL</Label>
              <Input
                id="purl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pnotes">Notes (optional)</Label>
              <Textarea
                id="pnotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl"
                placeholder="What should reviewers focus on?"
              />
            </div>
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={saving}
              onClick={() => void submitPortfolio()}
            >
              {saving ? "Submitting…" : "Submit portfolio"}
            </Button>
          </div>
          <ul className="space-y-3 lg:col-span-3">
            {reviews.map((r) => (
              <li
                key={r._id}
                className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-slate-900">{r.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      r.status === "reviewed"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "needs_changes"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {r.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {r.feedback ? (
                  <p className="mt-2 rounded-xl bg-[#F7F5FB] px-3 py-2 text-sm text-slate-700">
                    {r.feedback}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    Waiting for mentor/admin feedback…
                  </p>
                )}
              </li>
            ))}
            {!reviews.length ? (
              <li className="rounded-[1.5rem] border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                No submissions yet
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {tab === "community" ? (
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-900">
            Alumni community channel
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Open Community and look for the <strong>alumni</strong> channel in
            your completed program. Share wins, ask career questions, and
            support newer graduates.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/community">Go to Community</Link>
          </Button>
        </div>
      ) : null}

      {tab === "mentorship" ? (
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-900">
            Continued mentorship
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Completing a program keeps your mentor relationship active and adds
            an alumni career check-in goal (portfolio, applications, mock
            interview).
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/mentorship">Open Mentorship</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
