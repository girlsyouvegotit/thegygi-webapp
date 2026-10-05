import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import {
  Loader2,
  Search,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Compass,
  HeartHandshake,
  Eye,
  GraduationCap,
  Users,
  Home,
  Minus,
  Plus,
  Palette,
  X,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Globe,
  Pen,
  LayoutDashboard,
  Inbox,
  ListTodo,
  Settings,
  LogIn,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PageSeo } from "@/components/seo/PageSeo";
import { absoluteUrl, getSiteUrl, organizationJsonLd, PAGE_SEO } from "@/lib/seo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PostCard {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category: string;
  tags?: string[];
  publishedAt?: string;
  viewCount?: number;
  author?: { name?: string; avatar?: string; bio?: string };
}

interface WriterCard {
  _id: string;
  name: string;
  avatar?: string | null;
  bio?: string;
  role?: string;
  postCount?: number;
  socialLinks?: {
    twitter?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    website?: string | null;
  };
}

type TabKey = "all" | "popular" | string;

type ReadingTheme = {
  id: string;
  name: string;
  bg: string;
  panel: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  soft: string;
};

const READING_THEMES: ReadingTheme[] = [
  { id: "gygi", name: "GYGI Classic", bg: "#F4F2F7", panel: "#FFFFFF", surface: "#FFFFFF", text: "#1E1B4B", muted: "#94A3B8", accent: "#c147e9", soft: "#F3E8FF" },
  { id: "parchment", name: "Parchment", bg: "#F4EFE6", panel: "#FFFBF5", surface: "#FFFBF5", text: "#3D2B1F", muted: "#7A6A5A", accent: "#B45309", soft: "#FDE8C8" },
  { id: "midnight", name: "Midnight Read", bg: "#0F1220", panel: "#1A1F33", surface: "#22283F", text: "#E8EAF2", muted: "#9AA3B8", accent: "#C084FC", soft: "#2E2150" },
  { id: "forest", name: "Forest Focus", bg: "#EAF3EC", panel: "#FFFFFF", surface: "#FFFFFF", text: "#14352A", muted: "#5B7A6A", accent: "#059669", soft: "#D1FAE5" },
  { id: "ocean", name: "Ocean Calm", bg: "#E8F3F8", panel: "#FFFFFF", surface: "#FFFFFF", text: "#0C3B4D", muted: "#5B7C8A", accent: "#0284C7", soft: "#BAE6FD" },
  { id: "rose", name: "Rose Garden", bg: "#FBF0F3", panel: "#FFFFFF", surface: "#FFFFFF", text: "#4A1D2E", muted: "#8B6B76", accent: "#DB2777", soft: "#FCE7F3" },
  { id: "sand", name: "Desert Sand", bg: "#F6F0E6", panel: "#FFFCFA", surface: "#FFFCFA", text: "#4A3728", muted: "#8A7360", accent: "#D97706", soft: "#FEF3C7" },
  { id: "slate", name: "Cool Slate", bg: "#EEF1F5", panel: "#FFFFFF", surface: "#FFFFFF", text: "#1E293B", muted: "#64748B", accent: "#475569", soft: "#E2E8F0" },
  { id: "lavender", name: "Lavender Mist", bg: "#F3F0FA", panel: "#FFFFFF", surface: "#FFFFFF", text: "#2E1B4D", muted: "#6B6280", accent: "#7C3AED", soft: "#EDE9FE" },
  { id: "mint", name: "Mint Air", bg: "#EAF8F4", panel: "#FFFFFF", surface: "#FFFFFF", text: "#134E4A", muted: "#5B8A82", accent: "#0D9488", soft: "#CCFBF1" },
  { id: "amber", name: "Amber Glow", bg: "#FFF8EB", panel: "#FFFFFF", surface: "#FFFFFF", text: "#4A2C0A", muted: "#8A6A3A", accent: "#F59E0B", soft: "#FEF3C7" },
  { id: "ink", name: "Ink & Paper", bg: "#F5F5F0", panel: "#FFFFFF", surface: "#FFFFFF", text: "#111111", muted: "#666666", accent: "#111111", soft: "#E5E5E5" },
  { id: "berry", name: "Berry Punch", bg: "#F8EEF5", panel: "#FFFFFF", surface: "#FFFFFF", text: "#4A0E3A", muted: "#8A5A7A", accent: "#A21CAF", soft: "#FAE8FF" },
  { id: "sky", name: "Clear Sky", bg: "#EEF6FF", panel: "#FFFFFF", surface: "#FFFFFF", text: "#1E3A5F", muted: "#64748B", accent: "#3B82F6", soft: "#DBEAFE" },
  { id: "cocoa", name: "Cocoa Lounge", bg: "#F3EDE8", panel: "#FFFCFB", surface: "#FFFCFB", text: "#3B2416", muted: "#7A5A48", accent: "#92400E", soft: "#F5E0D0" },
  { id: "nordic", name: "Nordic Frost", bg: "#E8EEF2", panel: "#F8FAFC", surface: "#FFFFFF", text: "#0F172A", muted: "#64748B", accent: "#38BDF8", soft: "#E0F2FE" },
  { id: "sunset", name: "Sunset Desk", bg: "#FFF1EB", panel: "#FFFFFF", surface: "#FFFFFF", text: "#4A1C10", muted: "#8A5A48", accent: "#EA580C", soft: "#FFEDD5" },
  { id: "matcha", name: "Matcha", bg: "#F0F5E8", panel: "#FFFFFF", surface: "#FFFFFF", text: "#2A3B16", muted: "#6A7A5A", accent: "#65A30D", soft: "#ECFCCB" },
  { id: "grape", name: "Grape Noir", bg: "#1A1424", panel: "#261E35", surface: "#2F2642", text: "#F3E8FF", muted: "#B8A4D0", accent: "#c147e9", soft: "#3B2758" },
  { id: "ivory", name: "Quiet Ivory", bg: "#FAFAF7", panel: "#FFFFFF", surface: "#FFFFFF", text: "#292524", muted: "#78716C", accent: "#A8A29E", soft: "#F5F5F4" },
];

const THEME_STORAGE_KEY = "gygi-journal-reading-theme";

const TOPIC_ACCENTS = ["#c147e9", "#22C55E", "#F59E0B", "#3B82F6", "#EC4899", "#14B8A6"];

function writerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function WriterAvatar({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar?: string | null;
  className?: string;
}) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-black",
        className,
      )}
      style={{ background: "var(--j-soft)", color: "var(--j-accent)" }}
      aria-hidden
    >
      <span className="text-xs">{writerInitials(name) || "W"}</span>
    </div>
  );
}

const Blog = () => {
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [writers, setWriters] = useState<WriterCard[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [supportAmount, setSupportAmount] = useState(5);
  const [impactOpen, setImpactOpen] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeId, setThemeId] = useState("gygi");
  const [carousel, setCarousel] = useState(0);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const searchBootstrapped = useRef(false);
  const { resolvedTheme } = useTheme();

  const selectedTheme =
    READING_THEMES.find((t) => t.id === themeId) || READING_THEMES[0];
  const themeIsDark =
    selectedTheme.id === "midnight" || selectedTheme.id === "grape";
  // App dark mode must keep Journal readable even if a light reading theme is selected.
  const theme = useMemo(() => {
    if (resolvedTheme === "dark" && !themeIsDark) {
      return (
        READING_THEMES.find((t) => t.id === "midnight") || selectedTheme
      );
    }
    return selectedTheme;
  }, [resolvedTheme, selectedTheme, themeIsDark]);
  const categoryFilter = tab !== "all" && tab !== "popular" ? tab : "";

  const load = async (nextPage = 1, query = q) => {
    setLoading(true);
    try {
      const { data } = await api.get("/content/blog", {
        params: {
          q: query.trim() || undefined,
          category: categoryFilter || undefined,
          sort: tab === "popular" ? "popular" : sort,
          page: nextPage,
          limit: 9,
        },
      });
      const list: PostCard[] = data.data.posts || [];
      setPosts(list);
      setCategories(data.data.categories || []);
      setPages(data.data.pagination?.pages || 1);
      setPage(data.data.pagination?.page || 1);
      setTotal(data.data.pagination?.total || list.length);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && READING_THEMES.some((t) => t.id === saved)) setThemeId(saved);
  }, []);

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, sort]);

  // Ensure Journal opens at the top even if a prior page was scrolled down
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/content/writers", {
          params: { limit: 8 },
        });
        if (!cancelled) setWriters(data.data?.writers || []);
      } catch {
        if (!cancelled) setWriters([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!searchBootstrapped.current) {
      searchBootstrapped.current = true;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void load(1, q);
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const applyTheme = (id: string) => {
    setThemeId(id);
    localStorage.setItem(THEME_STORAGE_KEY, id);
    setThemesOpen(false);
  };

  const totalViews = useMemo(
    () => posts.reduce((sum, p) => sum + (p.viewCount || 0), 0),
    [posts],
  );

  // Always show pairs so the 2-up grid never leaves an empty rail beside a card
  const continuePageSize = 2;
  const continueMaxPage = Math.max(
    0,
    Math.ceil(Math.min(posts.length, 6) / continuePageSize) - 1,
  );
  const continuePosts = posts.slice(
    carousel * continuePageSize,
    carousel * continuePageSize + continuePageSize,
  );
  const lessonPosts = posts.slice(0, 5);
  const liveResults = posts.slice(0, 5);
  const topicChips = categories.slice(0, 3);
  const featuredWriters = writers.slice(0, 4);
  const sidebarWriters = writers.slice(0, 3);
  const heroImage = "/Banner.jpg";

  const chartBars = useMemo(() => {
    const cats = categories.slice(0, 3);
    if (cats.length === 0) return [40, 70, 55];
    return cats.map((c) => {
      const views = posts
        .filter((p) => p.category === c)
        .reduce((s, p) => s + (p.viewCount || 1), 0);
      return Math.max(28, Math.min(100, 30 + views * 12));
    });
  }, [categories, posts]);

  const engagementPct = Math.min(
    99,
    Math.max(18, Math.round((totalViews / Math.max(total, 1)) * 8 + 28)),
  );

  const themeVars = {
    ["--j-bg" as string]: theme.bg,
    ["--j-panel" as string]: theme.panel,
    ["--j-surface" as string]: theme.surface,
    ["--j-text" as string]: theme.text,
    ["--j-muted" as string]: theme.muted,
    ["--j-accent" as string]: theme.accent,
    ["--j-soft" as string]: theme.soft,
  };

  const slideContinue = (dir: -1 | 1) => {
    setCarousel((c) => Math.min(continueMaxPage, Math.max(0, c + dir)));
  };

  useEffect(() => {
    setCarousel(0);
  }, [posts.length, tab, q]);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "GYGI Journal",
    description: PAGE_SEO.blog.description,
    url: absoluteUrl("/blog"),
    publisher: {
      "@type": "Organization",
      name: "Girls You've Got It",
      url: getSiteUrl(),
    },
  };

  return (
    <div
      className={cn(
        "public-marketing min-h-screen font-sans",
        resolvedTheme === "dark" && "dark-journal",
      )}
      style={{ ...themeVars, background: theme.bg, color: theme.text }}
      data-color-mode={resolvedTheme || "light"}
    >
      <PageSeo
        title={PAGE_SEO.blog.title}
        description={PAGE_SEO.blog.description}
        path="/blog"
        image="/Banner.jpg"
        jsonLd={[organizationJsonLd(), blogJsonLd]}
      />
      <Navbar />

      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)_280px] lg:gap-5 xl:grid-cols-[250px_minmax(0,1fr)_300px] xl:gap-6">
          {/* ── Left rail ── */}
          <aside className="hidden lg:block">
            <div
              className="sticky top-20 flex h-[calc(100vh-6rem)] flex-col rounded-[1.75rem] p-5 shadow-[0_8px_30px_rgba(30,27,75,0.06)]"
              style={{ background: theme.panel }}
            >
              <div className="mb-7 flex items-center gap-2.5 px-1">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ background: theme.accent }}
                >
                  <Pen className="h-4 w-4" />
                </div>
                <p className="text-lg font-black tracking-tight" style={{ color: theme.text }}>
                  Journal
                </p>
              </div>

              <p
                className="mb-2 px-2 text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: theme.muted }}
              >
                Overview
              </p>
              <nav className="space-y-0.5">
                {[
                  {
                    label: "Stories",
                    icon: LayoutDashboard,
                    action: () => {
                      setTab("all");
                      setSort("newest");
                    },
                    active: tab === "all",
                  },
                  {
                    label: "Popular",
                    icon: Compass,
                    action: () => setTab("popular"),
                    active: tab === "popular",
                  },
                  { label: "Programs", icon: GraduationCap, href: "/#programs" },
                  { label: "Inbox", icon: Inbox, href: "/login" },
                  { label: "Tasks", icon: ListTodo, href: "/register" },
                  { label: "About", icon: Users, href: "/about" },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = "active" in item && item.active;
                  const className = cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  );
                  const style = active
                    ? { color: theme.accent }
                    : { color: theme.muted };
                  if (item.href) {
                    return (
                      <Link key={item.label} to={item.href} className={className} style={style}>
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {item.label}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className={className}
                      style={style}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <p
                className="mt-6 mb-2 px-2 text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: theme.muted }}
              >
                Writers
              </p>
              <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                {featuredWriters.length === 0 ? (
                  <li className="px-3 py-2 text-xs" style={{ color: theme.muted }}>
                    Writers will appear here.
                  </li>
                ) : (
                  featuredWriters.map((w) => (
                    <li key={w._id}>
                      <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2">
                        <WriterAvatar
                          name={w.name}
                          avatar={w.avatar}
                          className="h-9 w-9"
                        />
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ color: theme.text }}
                          >
                            {w.name}
                          </p>
                          <p className="truncate text-[11px]" style={{ color: theme.muted }}>
                            {w.role === "writer" ? "Writer" : "Editorial"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-auto space-y-0.5 pt-4">
                <p
                  className="mb-2 px-2 text-[10px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: theme.muted }}
                >
                  Settings
                </p>
                <button
                  type="button"
                  onClick={() => setThemesOpen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold"
                  style={{ color: theme.muted }}
                >
                  <Settings className="h-[18px] w-[18px]" />
                  Mood & theme
                </button>
                <Link
                  to="/login"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold"
                  style={{ color: theme.muted }}
                >
                  <LogIn className="h-[18px] w-[18px]" />
                  Sign in
                </Link>
                <Link
                  to="/"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold"
                  style={{ color: theme.muted }}
                >
                  <Home className="h-[18px] w-[18px]" />
                  Home
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Center ── */}
          <div className="min-w-0 space-y-5">
            {/* Top bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div ref={searchWrapRef} className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
                  style={{ color: theme.muted }}
                />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (q.trim()) setSearchOpen(true);
                  }}
                  placeholder="Search your stories…"
                  className="h-12 w-full rounded-full border-0 pr-10 pl-11 text-sm outline-none"
                  style={{
                    background: theme.panel,
                    color: theme.text,
                    boxShadow: "0 4px 20px rgba(30,27,75,0.05)",
                  }}
                  aria-label="Search stories"
                  aria-expanded={searchOpen && q.trim().length > 0}
                />
                {q && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQ("");
                      setSearchOpen(false);
                    }}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2"
                    style={{ color: theme.muted }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {searchOpen && q.trim().length > 0 && (
                  <div
                    className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 overflow-hidden rounded-3xl border shadow-xl"
                    style={{
                      background: theme.panel,
                      borderColor: `${theme.muted}22`,
                    }}
                  >
                    {loading ? (
                      <div
                        className="flex items-center gap-2 px-4 py-3 text-sm"
                        style={{ color: theme.muted }}
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching…
                      </div>
                    ) : liveResults.length === 0 ? (
                      <p className="px-4 py-3 text-sm" style={{ color: theme.muted }}>
                        No stories match “{q.trim()}”
                      </p>
                    ) : (
                      <ul>
                        {liveResults.map((post) => (
                          <li key={post._id}>
                            <Link
                              to={`/blog/${post.slug}`}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5"
                              style={{ color: theme.text }}
                            >
                              <img
                                src={post.coverImage || "/gygishot.jpg"}
                                alt=""
                                className="h-10 w-12 shrink-0 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {post.title}
                                </p>
                                <p
                                  className="truncate text-[11px]"
                                  style={{ color: theme.muted }}
                                >
                                  {post.category}
                                  {post.author?.name ? ` · ${post.author.name}` : ""}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setThemesOpen((v) => !v)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_4px_20px_rgba(30,27,75,0.05)]"
                style={{ background: theme.panel, color: theme.accent }}
                title="Reading mood"
                aria-expanded={themesOpen}
              >
                <Palette className="h-4 w-4" />
              </button>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_4px_20px_rgba(30,27,75,0.05)]"
                style={{ background: theme.panel }}
              >
                <NotificationBell className="h-10! w-10! rounded-full! border-0! shadow-none!" />
              </div>
            </div>

            {themesOpen && (
              <div
                className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto rounded-[1.5rem] p-3 sm:grid-cols-4"
                style={{ background: theme.panel }}
              >
                {READING_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTheme(t.id)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold"
                    style={{
                      background: t.bg,
                      color: t.text,
                      boxShadow:
                        themeId === t.id
                          ? `0 0 0 2px ${t.accent}`
                          : `0 0 0 1px ${t.muted}33`,
                    }}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ background: t.accent }}
                    />
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Mobile topics */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 lg:hidden">
                {["all", "popular", ...categories].map((c) => {
                  const active = tab === c;
                  const label =
                    c === "all" ? "All" : c === "popular" ? "Popular" : c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        if (c === "all") {
                          setTab("all");
                          setSort("newest");
                        } else setTab(c);
                      }}
                      className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold"
                      style={
                        active
                          ? { background: theme.accent, color: "#fff" }
                          : { background: theme.panel, color: theme.muted }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Hero banner with GYGI image */}
            <section className="relative isolate overflow-hidden rounded-[1.75rem] min-h-[200px] sm:min-h-[220px]">
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(105deg, ${theme.accent}f0 0%, ${theme.accent}cc 42%, #7C3AEDaa 72%, transparent 100%)`,
                }}
              />
              <div className="relative flex h-full min-h-[200px] flex-col justify-center px-5 py-7 sm:min-h-[220px] sm:px-8 sm:py-9">
                <div className="max-w-lg">
                  <h1 className="text-[1.35rem] font-black tracking-tight text-white sm:text-2xl sm:leading-snug lg:text-[1.75rem]">
                    Stories of learning, dignity &amp; free excellent education
                  </h1>
                  <p className="mt-2 max-w-md text-xs text-white/85 sm:text-sm">
                    Read impact journals from GYGI writers and mentors.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                    <Link
                      to="/register"
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1E1B4B] px-4 text-xs font-bold text-white transition hover:brightness-110 sm:h-11 sm:px-5 sm:text-sm"
                    >
                      Join Now
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setImpactOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-white/20 px-4 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/30 sm:h-11 sm:px-5 sm:text-sm"
                    >
                      <HeartHandshake className="h-4 w-4" />
                      Make an impact
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Topic chips — scroll on small screens, equal 3-col fill on larger */}
            {topicChips.length > 0 && (
              <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0">
                {topicChips.map((cat, i) => {
                  const count = posts.filter((p) => p.category === cat).length;
                  const accent = TOPIC_ACCENTS[i % TOPIC_ACCENTS.length];
                  const active = tab === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTab(cat)}
                      className="flex min-w-[9.5rem] flex-1 items-center gap-2.5 rounded-[1.25rem] px-3 py-3 text-left shadow-[0_6px_24px_rgba(30,27,75,0.05)] transition hover:-translate-y-0.5 sm:min-w-0 sm:gap-3 sm:rounded-[1.35rem] sm:px-4 sm:py-3.5"
                      style={{
                        background: theme.panel,
                        boxShadow: active
                          ? `0 0 0 2px ${theme.accent}`
                          : undefined,
                      }}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white sm:h-11 sm:w-11 sm:rounded-2xl"
                        style={{ background: accent }}
                      >
                        <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block text-[10px] leading-tight font-bold sm:text-xs md:text-[11px] lg:text-xs"
                          style={{ color: theme.muted }}
                        >
                          <span className="sm:hidden">
                            {count} {count === 1 ? "story" : "stories"}
                          </span>
                          <span className="hidden sm:inline">
                            Topic · {count} in view
                          </span>
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[13px] font-black sm:text-sm md:text-[15px]"
                          style={{ color: theme.text }}
                        >
                          {cat}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Continue reading */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black" style={{ color: theme.text }}>
                  {q.trim() ? "Matching stories" : "Continue reading"}
                </h2>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={() => slideContinue(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: theme.panel, color: theme.muted }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next"
                    onClick={() => slideContinue(1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: theme.panel, color: theme.muted }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {loading && posts.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2
                    className="h-7 w-7 animate-spin"
                    style={{ color: theme.accent }}
                  />
                </div>
              ) : posts.length === 0 ? (
                <div
                  className="rounded-[1.5rem] py-14 text-center"
                  style={{ background: theme.panel }}
                >
                  <p style={{ color: theme.muted }}>
                    {q.trim()
                      ? `No stories match “${q.trim()}”.`
                      : "No published stories yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {continuePosts.map((post) => (
                    <Link
                      key={post._id}
                      to={`/blog/${post.slug}`}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] shadow-[0_8px_28px_rgba(30,27,75,0.06)] transition hover:-translate-y-0.5"
                      style={{ background: theme.panel }}
                    >
                      <div className="relative aspect-16/11 overflow-hidden">
                        <img
                          src={post.coverImage || "/gygishot.jpg"}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <span
                          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
                          style={{ color: theme.accent }}
                        >
                          <Heart className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <span
                          className="inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                          style={{ background: theme.soft, color: theme.accent }}
                        >
                          {post.category}
                        </span>
                        <h3
                          className="mt-2 line-clamp-2 text-[15px] font-bold leading-snug"
                          style={{ color: theme.text }}
                        >
                          {post.title}
                        </h3>
                        <div className="mt-auto flex items-center gap-2 pt-3">
                          <WriterAvatar
                            name={post.author?.name || "Writer"}
                            avatar={post.author?.avatar}
                            className="h-7 w-7"
                          />
                          <span
                            className="truncate text-xs font-semibold"
                            style={{ color: theme.muted }}
                          >
                            {post.author?.name || "GYGI Writer"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {/* Fill orphan slot if an odd leftover ever appears */}
                  {continuePosts.length === 1 && (
                    <div
                      className="hidden min-h-full items-center justify-center rounded-[1.5rem] border border-dashed p-6 text-center sm:flex"
                      style={{
                        borderColor: `${theme.muted}33`,
                        color: theme.muted,
                        background: `${theme.soft}66`,
                      }}
                    >
                      <div>
                        <BookOpen
                          className="mx-auto mb-2 h-6 w-6"
                          style={{ color: theme.accent }}
                        />
                        <p className="text-sm font-semibold">More stories soon</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Your stories table */}
            {lessonPosts.length > 0 && (
              <section
                className="overflow-hidden rounded-[1.5rem] shadow-[0_8px_28px_rgba(30,27,75,0.05)]"
                style={{ background: theme.panel }}
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h2 className="text-lg font-black" style={{ color: theme.text }}>
                    Latest stories
                  </h2>
                  <span className="text-xs font-semibold" style={{ color: theme.muted }}>
                    {total} total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr
                        className="text-[10px] font-bold tracking-[0.14em] uppercase"
                        style={{ color: theme.muted }}
                      >
                        <th className="px-5 py-2 font-bold">Writer</th>
                        <th className="px-3 py-2 font-bold">Type</th>
                        <th className="px-3 py-2 font-bold">Story</th>
                        <th className="px-5 py-2 text-right font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonPosts.map((post) => (
                        <tr
                          key={post._id}
                          className="border-t"
                          style={{ borderColor: `${theme.muted}18` }}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <WriterAvatar
                                name={post.author?.name || "Writer"}
                                avatar={post.author?.avatar}
                                className="h-8 w-8"
                              />
                              <span
                                className="text-sm font-semibold"
                                style={{ color: theme.text }}
                              >
                                {post.author?.name || "Writer"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase"
                              style={{
                                background: theme.soft,
                                color: theme.accent,
                              }}
                            >
                              {post.category}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <p
                              className="line-clamp-1 max-w-[220px] text-sm font-medium"
                              style={{ color: theme.text }}
                            >
                              {post.title}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              to={`/blog/${post.slug}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80"
                              style={{
                                background: theme.soft,
                                color: theme.accent,
                              }}
                              aria-label={`Read ${post.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div
                    className="flex justify-center gap-2 border-t px-5 py-4"
                    style={{ borderColor: `${theme.muted}18` }}
                  >
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => void load(page - 1)}
                      className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold disabled:opacity-40"
                      style={{ background: theme.soft, color: theme.text }}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Prev
                    </button>
                    <span
                      className="flex h-9 items-center px-2 text-sm"
                      style={{ color: theme.muted }}
                    >
                      {page} / {pages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= pages}
                      onClick={() => void load(page + 1)}
                      className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold disabled:opacity-40"
                      style={{ background: theme.soft, color: theme.text }}
                    >
                      Next <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ── Right rail ── */}
          <aside className="mt-5 lg:mt-0">
            <div className="sticky top-20 space-y-5 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
            <div
              className="rounded-[1.75rem] p-5 shadow-[0_8px_30px_rgba(30,27,75,0.06)]"
              style={{ background: theme.panel }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-black" style={{ color: theme.text }}>
                  Statistic
                </h2>
                <MoreHorizontal className="h-4 w-4" style={{ color: theme.muted }} />
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3 h-28 w-28">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={theme.soft}
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={theme.accent}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${engagementPct * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-black text-white"
                      style={{ background: theme.accent }}
                    >
                      {engagementPct}%
                    </div>
                  </div>
                </div>
                <p className="text-base font-black" style={{ color: theme.text }}>
                  Journal pulse ✨
                </p>
                <p className="mt-1 text-xs" style={{ color: theme.muted }}>
                  {total} stories · {categories.length} topics · {totalViews || 0}{" "}
                  views
                </p>
              </div>

              <div className="mt-6 flex items-end justify-center gap-4 px-2">
                {(categories.slice(0, 3).length
                  ? categories.slice(0, 3)
                  : ["Week 1", "Week 2", "Week 3"]
                ).map((label, i) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div
                      className="w-10 rounded-t-xl rounded-b-md"
                      style={{
                        height: `${chartBars[i] || 40}px`,
                        background:
                          i === 1
                            ? theme.accent
                            : `${theme.accent}55`,
                      }}
                    />
                    <span
                      className="max-w-14 truncate text-[10px] font-semibold"
                      style={{ color: theme.muted }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-[1.75rem] p-5 shadow-[0_8px_30px_rgba(30,27,75,0.06)]"
              style={{ background: theme.panel }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black" style={{ color: theme.text }}>
                  Your writers
                </h2>
                <MoreHorizontal className="h-4 w-4" style={{ color: theme.muted }} />
              </div>

              <ul className="space-y-4">
                {sidebarWriters.length === 0 ? (
                  <li className="text-xs" style={{ color: theme.muted }}>
                    Writer profiles coming soon.
                  </li>
                ) : (
                  sidebarWriters.map((w) => {
                    const links = [
                      { href: w.socialLinks?.twitter, Icon: Twitter, label: "Twitter" },
                      { href: w.socialLinks?.linkedin, Icon: Linkedin, label: "LinkedIn" },
                      { href: w.socialLinks?.instagram, Icon: Instagram, label: "Instagram" },
                      { href: w.socialLinks?.facebook, Icon: Facebook, label: "Facebook" },
                      { href: w.socialLinks?.website, Icon: Globe, label: "Website" },
                    ].filter((l) => !!l.href);

                    return (
                      <li key={w._id}>
                        <div className="flex items-center gap-3">
                          <WriterAvatar
                            name={w.name}
                            avatar={w.avatar}
                            className="h-11 w-11"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-bold"
                              style={{ color: theme.text }}
                            >
                              {w.name}
                            </p>
                            <p
                              className="truncate text-xs"
                              style={{ color: theme.muted }}
                            >
                              {w.role === "writer" ? "Writer" : "Editorial"}
                              {typeof w.postCount === "number"
                                ? ` · ${w.postCount}`
                                : ""}
                            </p>
                          </div>
                          {links[0] ? (
                            <a
                              href={links[0].href!}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 text-xs font-bold"
                              style={{ color: theme.accent }}
                            >
                              + Follow
                            </a>
                          ) : (
                            <span
                              className="shrink-0 text-xs font-bold"
                              style={{ color: theme.accent }}
                            >
                              + Follow
                            </span>
                          )}
                        </div>
                        {links.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 pl-14">
                            {links.map(({ href, Icon, label }) => (
                              <a
                                key={label}
                                href={href!}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`${w.name} on ${label}`}
                                className="flex h-7 w-7 items-center justify-center rounded-full"
                                style={{
                                  background: theme.soft,
                                  color: theme.accent,
                                }}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>

              <Link
                to="/about"
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition hover:brightness-105"
                style={{ background: theme.accent }}
              >
                See All
              </Link>
            </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <Dialog open={impactOpen} onOpenChange={setImpactOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1E1B4B]">
              Make an impact
            </DialogTitle>
            <DialogDescription>
              Support a GYGI classroom — every contribution helps keep free
              excellent education running.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-[#F7F5F8] px-4 py-3">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setSupportAmount((n) => Math.max(1, n - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1E1B4B] shadow-sm"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-2xl font-black text-[#1E1B4B] tabular-nums">
                ${supportAmount}.00
              </span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setSupportAmount((n) => Math.min(250, n + 5))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1E1B4B] shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 25, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSupportAmount(n)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold",
                    supportAmount === n
                      ? "bg-primary text-white"
                      : "bg-[#F7F5F8] text-slate-600",
                  )}
                >
                  ${n}
                </button>
              ))}
            </div>
            <a
              href={`mailto:impact@girlsyougotit.org?subject=${encodeURIComponent(
                `GYGI Impact — $${supportAmount}`,
              )}&body=${encodeURIComponent(
                `I'd like to support GYGI with $${supportAmount}.`,
              )}`}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white"
            >
              Continue with ${supportAmount}
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/#impact"
              onClick={() => setImpactOpen(false)}
              className="flex justify-center text-sm font-semibold text-primary"
            >
              Or explore impact stories on the home page
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Blog;
