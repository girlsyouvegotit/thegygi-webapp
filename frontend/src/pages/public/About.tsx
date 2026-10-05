import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "@/lib/api";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import { SimpleSectionSkeleton } from "@/components/loading/PageSkeleton";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageSeo } from "@/components/seo/PageSeo";
import {
  absoluteUrl,
  getSiteUrl,
  organizationJsonLd,
  PAGE_SEO,
} from "@/lib/seo";

interface AboutData {
  status: string;
  updatedAt?: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  sections: {
    hero: {
      headline: string;
      subheadline: string;
      ctaLabel: string;
      ctaHref: string;
    };
    story: {
      title: string;
      body: string;
      milestones?: Array<{ year: string; title: string; description: string }>;
    };
    mission: {
      mission: string;
      vision: string;
      values?: Array<{ title: string; description: string }>;
    };
    whatWeDo: {
      title: string;
      body: string;
      items?: Array<{ title: string; description: string }>;
    };
    impact: {
      title: string;
      body: string;
      stats?: Array<{ label: string; value: string }>;
    };
    whoWeServe: { title: string; body: string };
    team: {
      title: string;
      members?: Array<{
        name: string;
        role: string;
        bio: string;
        image?: string;
      }>;
    };
    partners: { title: string; names?: string[] };
    getInvolved: {
      title: string;
      body: string;
      ctas?: Array<{ label: string; href: string }>;
    };
  };
}

const PROGRAM_IMAGES = [
  "/skillUp.jpg",
  "/tech1.jpg",
  "/vocTrain.jpg",
  "/pad1.jpg",
];
const VALUE_ICONS = [HeartHandshake, GraduationCap, Target, Users];

function paragraphs(text: string) {
  return text.split(/\n\n+/).filter(Boolean);
}

function partnerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

const FALLBACK_TEAM = [
  {
    name: "Teniade",
    role: "CEO",
    bio: "Leads GYGI’s vision for free, excellent education.",
    image: "/CEO.jpg",
  },
  {
    name: "Joy",
    role: "Mentorship",
    bio: "Builds mentor-mentee relationships that turn goals into momentum.",
    image: "/joy.jpg",
  },
  {
    name: "Daniel",
    role: "Tech instruction",
    bio: "Teaches practical web and digital skills for the future of work.",
    image: "/daniel.jpg",
  },
];

const softCard =
  "rounded-[1.75rem] bg-card shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03] dark:shadow-none dark:ring-border";

const About = () => {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const [activeProgram, setActiveProgram] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/content/about");
        if (!cancelled) setAbout(data.data.about);
      } catch {
        if (!cancelled) setError("Unable to load the About page right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const s = about?.sections;
  const members =
    s?.team.members && s.team.members.length > 0
      ? s.team.members
      : FALLBACK_TEAM;
  const stats = s?.impact.stats || [];
  const values = s?.mission.values || [];
  const programs = (
    s?.whatWeDo.items && s.whatWeDo.items.length > 0
      ? s.whatWeDo.items
      : [
          {
            title: "Live tech & career classes",
            description:
              "Coding, AI, UI/UX, data, and career literacy taught live by practitioners.",
          },
          {
            title: "Mentorship",
            description:
              "1:1 and group mentoring that guides goals, confidence, and next steps.",
          },
          {
            title: "Vocational skills",
            description:
              "Hands-on training that opens doors to income and independence.",
          },
        ]
  ).slice(0, 3);

  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: about?.seoTitle || PAGE_SEO.about.title,
    description: about?.seoDescription || PAGE_SEO.about.description,
    url: absoluteUrl("/about"),
    isPartOf: {
      "@type": "WebSite",
      name: "Girls You've Got It (GYGI)",
      url: getSiteUrl(),
    },
    mainEntity: organizationJsonLd(),
  };

  return (
    <div className="public-marketing min-h-screen bg-[#F4F4F6] font-sans text-foreground dark:bg-background">
      <PageSeo
        title={about?.seoTitle || PAGE_SEO.about.title}
        description={about?.seoDescription || PAGE_SEO.about.description}
        path="/about"
        image="/Banner.jpg"
        jsonLd={[organizationJsonLd(), aboutJsonLd]}
      />
      <Navbar />

      <main>
        {loading || !s ? (
          <div className="mx-auto max-w-6xl px-4 py-10">
            <SimpleSectionSkeleton />
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:space-y-20 sm:px-6 sm:py-14 lg:px-8">
            {/* ── Soft intro card (neumorphic) ── */}
            <section className={cn(softCard, "p-6 sm:p-8 lg:p-10")}>
              <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                    About GYGI
                  </p>
                  <h1 className="mt-3 text-[2.35rem] font-black leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl">
                    {s.hero.headline}
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {s.hero.subheadline}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      to={s.hero.ctaHref || "/register"}
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition hover:bg-primary hover:text-primary-foreground dark:bg-primary dark:text-primary-foreground"
                    >
                      {s.hero.ctaLabel || "Join GYGI free"}
                      <span className="relative -mr-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/20">
                        <img
                          src={members[0]?.image || "/CEO.jpg"}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-90"
                        />
                      </span>
                    </Link>
                    <Link
                      to="/blog"
                      className="inline-flex h-12 items-center rounded-full bg-muted px-5 text-sm font-bold text-foreground transition hover:bg-primary/10 hover:text-primary"
                    >
                      View stories
                    </Link>
                  </div>
                </div>

                <div className="relative">
                  <div className="overflow-hidden rounded-[1.5rem] bg-muted">
                    <img
                      src="/Banner.jpg"
                      alt="GYGI community"
                      className="aspect-[5/4] w-full object-cover"
                      decoding="async"
                      fetchPriority="high"
                    />
                  </div>
                  <div className="absolute -bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-lg ring-1 ring-border/60 sm:left-6 sm:right-6">
                    <div className="flex -space-x-2">
                      {members.slice(0, 3).map((m) => (
                        <img
                          key={m.name}
                          src={m.image || "/gygishot.jpg"}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-card"
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      <span className="font-black text-foreground">
                        {stats[0]?.value || "10,000+"}
                      </span>{" "}
                      {stats[0]?.label || "girls reached"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Program cards — middle highlighted (medical template) ── */}
            <section>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                    {s.whatWeDo.title}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    Ways we unlock opportunity
                  </h2>
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {s.whatWeDo.body}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {programs.map((item, i) => {
                  const active = activeProgram === i;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActiveProgram(i)}
                      onMouseEnter={() => setActiveProgram(i)}
                      className={cn(
                        "group flex flex-col overflow-hidden rounded-[1.75rem] p-5 text-left transition duration-300 sm:p-6",
                        active
                          ? "bg-primary text-primary-foreground shadow-[0_20px_50px_rgba(193,71,233,0.35)]"
                          : cn(softCard, "hover:-translate-y-0.5"),
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-black tracking-tight">
                          {item.title}
                        </h3>
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-3 flex-1 text-sm leading-relaxed",
                          active
                            ? "text-white/85"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.description}
                      </p>
                      <div className="mt-5 overflow-hidden rounded-2xl">
                        <img
                          src={PROGRAM_IMAGES[i % PROGRAM_IMAGES.length]}
                          alt=""
                          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Why choose us ── */}
            <section className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                Why choose us
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl sm:leading-[1.15]">
                Free excellent education that empowers girls with{" "}
                <span className="text-primary">
                  skills, dignity, and pathways
                </span>{" "}
                to independence.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {s.mission.mission}
              </p>
            </section>

            {/* ── Leadership spotlight (doctors layout) ── */}
            <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                  Our people
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">
                  {s.team.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.mission.vision}
                </p>

                <div className="mt-8 grid grid-cols-2 gap-6">
                  {(stats.slice(0, 2).length
                    ? stats.slice(0, 2)
                    : [
                        { value: "14", label: "Countries reached" },
                        { value: "500+", label: "Future-ready learners" },
                      ]
                  ).map((stat) => (
                    <div key={stat.label}>
                      <p className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Soft member list (neumorphic) */}
                <div className={cn(softCard, "mt-8 divide-y divide-border/70")}>
                  {members.slice(0, 3).map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <img
                        src={m.image || "/gygishot.jpg"}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-muted"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {m.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.role}
                        </p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-lg">
                <div className="relative overflow-hidden rounded-[2rem] bg-muted">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 20%, #c147e9 1.5px, transparent 1.5px), radial-gradient(circle at 80% 60%, #c147e9 1px, transparent 1px)",
                      backgroundSize: "28px 28px, 18px 18px",
                    }}
                  />
                  <img
                    src={members[0]?.image || "/CEO.jpg"}
                    alt={members[0]?.name || "Teniade"}
                    className="relative aspect-[4/5] w-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-3 -left-3 h-14 w-14 rounded-2xl bg-primary shadow-lg sm:h-16 sm:w-16" />
                <div className={cn(softCard, "absolute right-4 bottom-4 p-3 sm:right-6 sm:bottom-6")}>
                  <p className="text-sm font-black">
                    {members[0]?.name || "Teniade"}
                  </p>
                  <p className="text-xs font-semibold text-primary">
                    {members[0]?.role || "CEO"}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Values soft grid ── */}
            {values.length > 0 && (
              <section>
                <div className="mb-6 text-center">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                    Our values
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">
                    What guides every class &amp; mentor session
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {values.slice(0, 4).map((v, i) => {
                    const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
                    return (
                      <article key={v.title} className={cn(softCard, "p-5")}>
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="mt-4 text-base font-bold">{v.title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {v.description}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Features masonry (app features layout) ── */}
            <section>
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  What you unlock with GYGI
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {s.impact.body}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-4">
                  <article
                    className={cn(
                      softCard,
                      "grid overflow-hidden sm:grid-cols-[1.1fr_0.9fr]",
                    )}
                  >
                    <div className="flex flex-col justify-center p-6 sm:p-7">
                      <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                        Live learning
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-tight">
                        {programs[0]?.title || "Live classes"}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {programs[0]?.description}
                      </p>
                    </div>
                    <div className="relative min-h-[180px] bg-muted">
                      <img
                        src="/tech1.jpg"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </article>

                  <article
                    className={cn(
                      softCard,
                      "grid overflow-hidden sm:grid-cols-[0.9fr_1.1fr]",
                    )}
                  >
                    <div className="relative order-2 min-h-[180px] bg-muted sm:order-1">
                      <img
                        src="/joy.jpg"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="order-1 flex flex-col justify-center p-6 sm:order-2 sm:p-7">
                      <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                        Mentorship
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-tight">
                        {programs[1]?.title || "Personal mentors"}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {programs[1]?.description}
                      </p>
                    </div>
                  </article>
                </div>

                <article
                  className={cn(
                    softCard,
                    "flex flex-col overflow-hidden lg:min-h-full",
                  )}
                >
                  <div className="p-6 sm:p-7">
                    <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                      Community
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight">
                      {s.whoWeServe.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {paragraphs(s.whoWeServe.body)[0]}
                    </p>
                  </div>
                  <div className="relative mt-auto min-h-[240px] flex-1 bg-muted">
                    <img
                      src="/groupies.jpg"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-card/95 p-3 shadow-lg backdrop-blur-sm ring-1 ring-border/50">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-xs font-bold text-foreground">
                          Learn free. Grow with mentors. Lead with confidence.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            {/* ── Impact stats soft strip ── */}
            {stats.length > 0 && (
              <section className={cn(softCard, "grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-4")}>
                {stats.slice(0, 4).map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.35rem] bg-muted/70 px-4 py-5 text-center dark:bg-muted"
                  >
                    <p className="text-2xl font-black text-primary sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {/* ── Story ── */}
            <section className={cn(softCard, "grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]")}>
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                  {s.story.title}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  From community workshops to classrooms across Africa
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {paragraphs(s.story.body)
                    .slice(0, 2)
                    .map((p) => (
                      <p key={p.slice(0, 28)}>{p}</p>
                    ))}
                </div>
              </div>
              <div className="space-y-3">
                {(s.story.milestones || []).slice(0, 3).map((m) => (
                  <div
                    key={m.year}
                    className="rounded-2xl bg-muted/80 p-4 dark:bg-muted"
                  >
                    <p className="text-[11px] font-bold text-primary uppercase">
                      {m.year}
                    </p>
                    <p className="mt-1 text-sm font-bold">{m.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Partners ── */}
            {(s.partners.names || []).length > 0 && (
              <section className="text-center">
                <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                  {s.partners.title}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {(s.partners.names || []).map((name) => (
                    <div
                      key={name}
                      className={cn(
                        softCard,
                        "flex items-center gap-3 px-4 py-3",
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-xs font-black text-primary">
                        {partnerInitials(name)}
                      </span>
                      <span className="pr-1 text-sm font-bold">{name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Final CTA ── */}
            <section className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl"
                aria-hidden
              />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                    <BookOpen className="h-3.5 w-3.5" />
                    Get involved
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                    {s.getInvolved.title}
                  </h2>
                  <p className="mt-3 text-sm text-white/85">
                    {s.getInvolved.body}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(s.getInvolved.ctas || []).slice(0, 2).map((cta, i) => (
                    <Link
                      key={cta.label}
                      to={cta.href}
                      className={cn(
                        "inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-bold transition",
                        i === 0
                          ? "bg-foreground text-background hover:bg-background hover:text-foreground dark:bg-background dark:text-foreground"
                          : "bg-white text-primary hover:brightness-95",
                      )}
                    >
                      {cta.label}
                      {i === 0 && <ArrowRight className="h-4 w-4" />}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default About;
