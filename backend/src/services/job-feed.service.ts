/**
 * Fetches relevant remote tech jobs from free public APIs:
 * - Remotive (https://remotive.com/api/remote-jobs)
 * - Arbeitnow (https://www.arbeitnow.com/api/job-board-api)
 *
 * Matching is driven by live GYGI course category names (and tags/slugs).
 * Attribution required by Remotive: link back + mention source.
 * Results are cached in-memory (~6h) to respect rate guidance.
 */

export type CareerJob = {
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
  /** GYGI course categories this job matched */
  matchedCategories?: string[];
};

type CacheBucket = {
  expiresAt: number;
  jobs: CareerJob[];
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, CacheBucket>();

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "of",
  "a",
  "an",
  "in",
  "to",
  "with",
  "on",
  "at",
  "by",
  "course",
  "program",
  "training",
  "class",
  "classes",
  "skills",
  "skill",
  "learn",
  "learning",
  "intro",
  "introduction",
  "basics",
  "basic",
  "advanced",
  "beginner",
]);

/** Domain expansions keyed by tokens commonly found in GYGI category names. */
const SYNONYMS: Record<string, string[]> = {
  web: ["web", "frontend", "front-end", "javascript", "react", "developer", "html", "css"],
  development: ["developer", "software", "engineer", "programming", "coding"],
  software: ["software", "developer", "engineer", "programming"],
  frontend: ["frontend", "front-end", "react", "javascript", "ui", "web"],
  backend: ["backend", "back-end", "api", "node", "server", "engineer"],
  fullstack: ["full stack", "fullstack", "full-stack", "developer"],
  "ui/ux": ["design", "ui", "ux", "figma", "product design", "user experience"],
  ui: ["design", "ui", "ux", "figma", "interface"],
  ux: ["design", "ui", "ux", "figma", "user experience"],
  design: ["design", "ui", "ux", "figma", "product design", "graphic"],
  data: ["data", "analyst", "analytics", "python", "sql", "science", "bi"],
  science: ["science", "scientist", "research", "data"],
  analytics: ["analytics", "analyst", "data", "bi", "sql"],
  ai: ["ai", "artificial intelligence", "prompt", "machine learning", "ml", "llm"],
  prompt: ["ai", "prompt", "llm", "chatgpt", "generative"],
  prompting: ["ai", "prompt", "llm", "generative"],
  cyber: ["cyber", "security", "infosec", "soc"],
  security: ["security", "cyber", "infosec"],
  vocational: ["vocational", "trade", "apprentice", "technician", "support"],
  health: ["health", "healthcare", "medical", "clinical", "wellness", "public health"],
  community: ["community", "outreach", "nonprofit", "social"],
  nursing: ["nursing", "nurse", "clinical", "healthcare"],
  marketing: ["marketing", "growth", "seo", "content", "brand"],
  business: ["business", "operations", "analyst", "strategy", "admin"],
  finance: ["finance", "accounting", "bookkeeping", "financial"],
  writing: ["writing", "writer", "content", "copy", "editorial"],
  content: ["content", "writer", "copy", "editorial", "marketing"],
  education: ["education", "teacher", "tutor", "instructional", "learning"],
  project: ["project", "pm", "program manager", "coordinator"],
  management: ["manager", "management", "operations", "lead"],
  mobile: ["mobile", "android", "ios", "react native", "flutter"],
  cloud: ["cloud", "aws", "azure", "devops", "infrastructure"],
  devops: ["devops", "sre", "cloud", "infrastructure", "ci/cd"],
};

const JUNIOR_HINTS = /(junior|entry|intern|graduate|associate|trainee|apprentice)/i;
const SENIOR_HINTS = /(senior|lead|principal|staff|head|director|vp)/i;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+/&\s._-]/g, " ")
    .split(/[\s/\-_&+.]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Build match keywords from live category names/slugs/tags.
 * Works for current and future categories without hardcoding course titles.
 */
export function categoryToKeywords(categoryNames: string[]): string[] {
  const out = new Set<string>();

  for (const raw of categoryNames) {
    const name = (raw || "").trim();
    if (!name) continue;
    const lower = name.toLowerCase().replace(/[-_]+/g, " ");
    out.add(lower);

    const tokens = tokenize(name);
    for (const token of tokens) {
      out.add(token);
      for (const [key, words] of Object.entries(SYNONYMS)) {
        if (
          token === key ||
          token.includes(key) ||
          key.includes(token) ||
          lower.includes(key)
        ) {
          words.forEach((w) => out.add(w));
        }
      }
    }

    // Multi-word phrases from the category name itself (bigrams)
    for (let i = 0; i < tokens.length - 1; i++) {
      out.add(`${tokens[i]} ${tokens[i + 1]}`);
    }
  }

  return [...out];
}

function jobHaystack(job: CareerJob): string {
  return `${job.title} ${job.category} ${job.tags.join(" ")}`.toLowerCase();
}

function scoreAgainstKeywords(hay: string, keywords: string[]): number {
  let score = 0;
  for (const k of keywords) {
    if (!k || k.length < 2) continue;
    if (!hay.includes(k)) continue;
    // Longer / multi-word matches weigh more
    score += k.includes(" ") || k.length >= 8 ? 3 : 1;
  }
  return score;
}

/** Which input category labels matched this job (for UI transparency). */
function matchedCategoryLabels(
  job: CareerJob,
  categoryNames: string[],
): string[] {
  const hay = jobHaystack(job);
  const matched: string[] = [];
  for (const name of categoryNames) {
    const label = name.trim();
    if (!label) continue;
    // Prefer human-readable names over slugs in the UI
    if (/^[a-z0-9-]+$/.test(label) && !label.includes(" ")) continue;
    const kws = categoryToKeywords([label]);
    if (scoreAgainstKeywords(hay, kws) > 0) matched.push(label);
  }
  return matched;
}

async function fetchRemotive(): Promise<CareerJob[]> {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=100", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Remotive HTTP ${res.status}`);
  const data = (await res.json()) as {
    jobs?: Array<{
      id: number | string;
      title: string;
      company_name: string;
      url: string;
      candidate_required_location?: string;
      salary?: string;
      category?: string;
      tags?: string[];
      publication_date?: string;
      company_logo?: string;
    }>;
  };

  return (data.jobs || []).map((j) => ({
    id: `remotive-${j.id}`,
    title: j.title,
    company: j.company_name,
    url: j.url,
    location: j.candidate_required_location || "Remote",
    salary: j.salary || undefined,
    category: j.category || "Remote",
    tags: Array.isArray(j.tags) ? j.tags.map(String) : [],
    source: "remotive" as const,
    publishedAt: j.publication_date,
    companyLogo: j.company_logo,
  }));
}

async function fetchArbeitnow(): Promise<CareerJob[]> {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Arbeitnow HTTP ${res.status}`);
  const data = (await res.json()) as {
    data?: Array<{
      slug: string;
      title: string;
      company_name: string;
      url?: string;
      location?: string;
      tags?: string[];
      remote?: boolean;
      created_at?: number;
    }>;
  };

  return (data.data || [])
    .filter((j) => j.remote !== false)
    .map((j) => ({
      id: `arbeitnow-${j.slug}`,
      title: j.title,
      company: j.company_name,
      url: j.url || `https://www.arbeitnow.com/jobs/${j.slug}`,
      location: j.location || "Remote",
      category: (j.tags && j.tags[0]) || "Tech",
      tags: Array.isArray(j.tags) ? j.tags.map(String) : [],
      source: "arbeitnow" as const,
      publishedAt: j.created_at
        ? new Date(j.created_at * 1000).toISOString()
        : undefined,
    }));
}

async function loadAllJobs(): Promise<CareerJob[]> {
  const cached = cache.get("__all__");
  if (cached && cached.expiresAt > Date.now()) return cached.jobs;

  const results = await Promise.allSettled([
    fetchRemotive(),
    fetchArbeitnow(),
  ]);

  const jobs: CareerJob[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") jobs.push(...r.value);
  }

  const seen = new Set<string>();
  const unique: CareerJob[] = [];
  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}::${job.company.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }

  cache.set("__all__", {
    expiresAt: Date.now() + CACHE_TTL_MS,
    jobs: unique,
  });
  return unique;
}

export async function fetchRelevantJobs(opts: {
  categoryNames?: string[];
  /** Display labels used for matchedCategories (usually category names only) */
  categoryLabels?: string[];
  search?: string;
  limit?: number;
}): Promise<{
  jobs: CareerJob[];
  sources: string[];
  attribution: string;
  matchedFromCategories: string[];
}> {
  const all = await loadAllJobs();
  const categoryNames = (opts.categoryNames || [])
    .map((n) => n.trim())
    .filter(Boolean);
  const labels =
    opts.categoryLabels?.filter(Boolean) ||
    categoryNames.filter((n) => !/^[a-z0-9-]+$/.test(n) || n.includes(" "));
  const keywords = categoryToKeywords(categoryNames);
  const search = (opts.search || "").trim().toLowerCase();
  const limit = Math.min(40, Math.max(1, opts.limit || 24));

  type Scored = { job: CareerJob; score: number };
  let scored: Scored[] = all
    .map((job) => ({
      job,
      score: scoreAgainstKeywords(jobHaystack(job), keywords),
    }))
    .filter((row) => row.score > 0);

  // If category keywords are too niche for the current feed, soften to
  // junior/entry roles that still share at least one token with categories.
  if (!scored.length && keywords.length) {
    const softKeys = keywords.filter((k) => k.length >= 3);
    scored = all
      .filter((job) => {
        const hay = jobHaystack(job);
        return (
          JUNIOR_HINTS.test(job.title) &&
          softKeys.some((k) => hay.includes(k))
        );
      })
      .map((job) => ({ job, score: 1 }));
  }

  if (search) {
    scored = scored.filter(({ job }) => {
      const hay = `${jobHaystack(job)} ${job.company}`.toLowerCase();
      return hay.includes(search);
    });
  }

  scored.sort((a, b) => {
    const juniorBoost = (j: CareerJob) => {
      if (JUNIOR_HINTS.test(j.title)) return 2;
      if (SENIOR_HINTS.test(j.title)) return 0;
      return 1;
    };
    const diff = b.score - a.score;
    if (diff !== 0) return diff;
    return juniorBoost(b.job) - juniorBoost(a.job);
  });

  const jobs = scored.slice(0, limit).map(({ job }) => ({
    ...job,
    matchedCategories: matchedCategoryLabels(job, labels),
  }));

  return {
    jobs,
    sources: ["Remotive", "Arbeitnow"],
    attribution:
      "Jobs sourced from Remotive and Arbeitnow. Remotive listings link back to remotive.com.",
    matchedFromCategories: labels,
  };
}
