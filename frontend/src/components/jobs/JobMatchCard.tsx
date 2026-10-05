import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Target,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type JobMatchCardJob = {
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

/** GYGI glass peeks — purple family with soft role tint. */
const PEEK_TONES = [
  {
    key: "violet",
    glass: "bg-[#c147e9]/25",
    text: "text-white",
    bar: "bg-white/80",
  },
  {
    key: "fuchsia",
    glass: "bg-[#d946ef]/22",
    text: "text-white",
    bar: "bg-white/80",
  },
  {
    key: "indigo",
    glass: "bg-[#5B5FEF]/28",
    text: "text-white",
    bar: "bg-white/80",
  },
  {
    key: "plum",
    glass: "bg-[#9b2ec4]/30",
    text: "text-white",
    bar: "bg-white/80",
  },
] as const;

function peekTone(job: JobMatchCardJob) {
  const hay =
    `${job.title} ${job.category} ${job.tags.join(" ")}`.toLowerCase();
  if (/(design|ui|ux)/.test(hay)) return PEEK_TONES[1];
  if (/(data|analyst|science)/.test(hay)) return PEEK_TONES[2];
  if (/(developer|engineer|software|web)/.test(hay)) return PEEK_TONES[0];
  if (/(ai|prompt|ml)/.test(hay)) return PEEK_TONES[3];
  return PEEK_TONES[0];
}

function matchScore(job: JobMatchCardJob) {
  let score = 62;
  if (job.matchedCategories?.length)
    score += 18 + job.matchedCategories.length * 4;
  score += Math.min(12, job.tags.length * 2);
  if (/(junior|entry|intern|graduate)/i.test(job.title)) score += 6;
  return Math.min(98, score);
}

function levelLabel(job: JobMatchCardJob) {
  const t = job.title.toLowerCase();
  if (/(senior|lead|principal|staff|head)/.test(t)) return "Senior level";
  if (/(junior|entry|intern|graduate|associate)/.test(t)) return "Junior level";
  return "Mid level";
}

type Props = {
  job?: JobMatchCardJob;
  jobs?: JobMatchCardJob[];
  className?: string;
  stacked?: boolean;
};

/** GYGI glass deck — sleek stacked job cards with purple brand + glassmorphism. */
export default function JobMatchCard({
  job,
  jobs: jobsProp,
  className,
  stacked = true,
}: Props) {
  const deck = jobsProp?.length ? jobsProp : job ? [job] : [];
  const [index, setIndex] = useState(0);
  const deckKey = deck.map((j) => j.id).join("|");

  useEffect(() => {
    setIndex(0);
  }, [deckKey]);

  if (!deck.length) return null;

  const n = deck.length;
  const safeIndex = ((index % n) + n) % n;
  const current = deck[safeIndex];
  const canAdvance = n > 1;
  const score = matchScore(current);
  const program =
    current.matchedCategories?.[0] || current.category || "GYGI match";

  const rows = [
    {
      icon: CheckCircle2,
      title: current.title,
      detail: `${levelLabel(current)} · Remote`,
      wrap: "bg-primary/10 text-primary",
      mobile: true,
    },
    {
      icon: Building2,
      title: current.company,
      detail: `Via ${current.source}`,
      wrap: "bg-[#5B5FEF]/12 text-[#5B5FEF]",
      mobile: true,
    },
    {
      icon: MapPin,
      title: current.location || "Remote",
      detail: current.salary?.trim()
        ? current.salary.trim()
        : "Salary not listed",
      wrap: "bg-[#9b2ec4]/12 text-[#9b2ec4]",
      mobile: false,
    },
    {
      icon: Target,
      title: program,
      detail: current.tags.slice(0, 2).join(" · ") || "Skills from tags",
      wrap: "bg-[#f3e0fb] text-[#c147e9]",
      mobile: false,
    },
  ];

  const go = (dir: 1 | -1) => {
    if (!canAdvance) return;
    setIndex((i) => (i + dir + n) % n);
  };

  const peekJobs = canAdvance
    ? [
        {
          job: deck[(safeIndex + 1) % n],
          rot: "rotate-[6deg] sm:rotate-[8deg]",
          z: "z-[1]",
          y: "-top-1 right-0 sm:-top-2",
        },
        {
          job: deck[(safeIndex + 2) % n],
          rot: "rotate-[-5deg] sm:rotate-[-6deg]",
          z: "z-0",
          y: "top-4 -left-0.5 sm:top-6 sm:-left-1",
        },
      ]
    : [];

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[22rem]",
        stacked && canAdvance ? "px-2 py-4 sm:px-5 sm:py-8" : "py-1",
        className,
      )}
    >
      {/* Ambient GYGI glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-8 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(193,71,233,0.3),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(91,95,239,0.2),transparent_50%)] blur-2xl sm:inset-6"
      />

      {/* Angled glass peeks — max 2 to keep mobile height down */}
      {stacked
        ? peekJobs.map((peek, i) => {
            const tone = peekTone(peek.job);
            const labels = ["UPCOMING", "MATCH"] as const;
            return (
              <button
                key={`${peek.job.id}-peek-${i}`}
                type="button"
                onClick={() => go(1)}
                className={cn(
                  "absolute left-3 right-3 h-[90%] overflow-hidden rounded-[1.5rem] p-3 text-left transition sm:left-4 sm:right-4 sm:rounded-[1.75rem] sm:p-4",
                  "border border-white/40 shadow-[0_12px_40px_rgba(45,45,68,0.18)]",
                  "backdrop-blur-xl supports-[backdrop-filter]:bg-white/10",
                  tone.glass,
                  peek.rot,
                  peek.z,
                  peek.y,
                  "hover:border-white/60 hover:shadow-[0_16px_48px_rgba(193,71,233,0.25)]",
                )}
                aria-label={`Show ${peek.job.title}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.45) 0%, transparent 45%, rgba(193,71,233,0.2) 100%)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    {i === 0 ? (
                      <Briefcase className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", tone.text)} />
                    ) : (
                      <Target className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", tone.text)} />
                    )}
                    <span
                      className={cn(
                        "text-[9px] font-black tracking-[0.14em] sm:text-[10px]",
                        tone.text,
                      )}
                    >
                      {labels[i] || "GYGI"}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-2 line-clamp-2 text-xs font-bold drop-shadow-sm sm:mt-3 sm:text-sm",
                      tone.text,
                    )}
                  >
                    {peek.job.title}
                  </p>
                  {i === 1 ? (
                    <div className="mt-2 sm:mt-4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/25 sm:h-2">
                        <div
                          className={cn("h-full rounded-full", tone.bar)}
                          style={{ width: `${matchScore(peek.job)}%` }}
                        />
                      </div>
                      <p
                        className={cn(
                          "mt-1 text-[10px] font-bold sm:text-[11px]",
                          tone.text,
                        )}
                      >
                        {matchScore(peek.job)}% match
                      </p>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "mt-1.5 line-clamp-1 text-[11px] opacity-90 sm:mt-2 sm:line-clamp-2 sm:text-xs",
                        tone.text,
                      )}
                    >
                      {peek.job.company} · {peek.job.location || "Remote"}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        : null}

      {/* Front glass card */}
      <article
        className={cn(
          "relative z-10 overflow-hidden rounded-[1.5rem] p-3.5 sm:rounded-[1.85rem] sm:p-6",
          "border border-white/50 bg-white/70 shadow-[0_20px_50px_rgba(45,45,68,0.14)]",
          "backdrop-blur-2xl supports-[backdrop-filter]:bg-white/55",
          "ring-1 ring-[#c147e9]/15",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "linear-gradient(165deg, rgba(243,224,251,0.75) 0%, rgba(255,255,255,0.35) 38%, rgba(255,255,255,0.55) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#c147e9]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-[#5B5FEF]/15 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {current.companyLogo ? (
                <img
                  src={current.companyLogo}
                  alt=""
                  className="h-8 w-8 rounded-xl object-cover shadow-sm ring-2 ring-white/70 sm:h-10 sm:w-10 sm:rounded-2xl"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#c147e9] to-[#5B5FEF] text-xs font-black text-white shadow-md shadow-primary/30 ring-2 ring-white/70 sm:h-10 sm:w-10 sm:rounded-2xl sm:text-sm">
                  {(current.company[0] || "G").toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#2D2D44] sm:text-sm">
                  {current.company}
                </p>
                <p className="text-[9px] font-bold tracking-[0.14em] text-primary/70 uppercase sm:text-[10px]">
                  GYGI job match
                  {canAdvance ? ` · ${safeIndex + 1}/${n}` : ""}
                </p>
              </div>
            </div>
            {canAdvance ? (
              <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/50 text-[#2D2D44] shadow-sm backdrop-blur-md transition hover:bg-white/80 sm:h-8 sm:w-8"
                  aria-label="Previous job"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/50 text-[#2D2D44] shadow-sm backdrop-blur-md transition hover:bg-white/80 sm:h-8 sm:w-8"
                  aria-label="Next job"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <h3 className="mt-3 line-clamp-2 text-base font-black tracking-tight text-[#2D2D44] sm:mt-5 sm:text-2xl">
            {current.title}
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-400 sm:mt-1 sm:text-xs">
            {levelLabel(current)} · {current.location || "Remote"}
            {current.salary?.trim() ? ` · ${current.salary.trim()}` : ""}
          </p>

          {/* Mobile: 2 compact rows; desktop: full list */}
          <ul className="mt-3 space-y-1.5 sm:mt-5 sm:space-y-3">
            {rows.map((row) => (
              <li
                key={row.title + row.detail}
                className={cn(
                  "items-start gap-2 rounded-xl border border-white/50 bg-white/40 px-2 py-1.5 backdrop-blur-md sm:gap-3 sm:rounded-2xl sm:px-2.5 sm:py-2",
                  row.mobile ? "flex" : "hidden sm:flex",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl",
                    row.wrap,
                  )}
                >
                  <row.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#2D2D44] sm:text-sm">
                    {row.title}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 sm:text-xs">
                    {row.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-1.5 backdrop-blur-md sm:mt-4 sm:rounded-2xl sm:px-3 sm:py-2.5">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
            <p className="min-w-0 truncate text-[11px] font-semibold text-[#2D2D44] sm:text-xs">
              {score}% match
              {current.matchedCategories?.length
                ? ` · ${current.matchedCategories.slice(0, 2).join(", ")}`
                : ""}
            </p>
          </div>

          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "mt-3 flex h-10 w-full items-center justify-center rounded-full text-sm font-bold text-white transition sm:mt-5 sm:h-12",
              "bg-gradient-to-r from-[#c147e9] via-[#b03ad4] to-[#5B5FEF]",
              "shadow-lg shadow-primary/30 hover:brightness-105 active:scale-[0.99]",
              "ring-1 ring-white/40",
            )}
          >
            Apply Now
          </a>
        </div>
      </article>
    </div>
  );
}
