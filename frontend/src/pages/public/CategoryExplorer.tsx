import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";
import {
  ArrowRight,
  Award,
  BookOpen,
  Clock,
  FolderTree,
  GraduationCap,
  HeartHandshake,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import CategoryGrid from "@/components/category/CategoryGrid";
import EmptyState from "@/components/global/EmptyState";
import CategorySwitchDialog from "@/components/learning/CategorySwitchDialog";
import { PageSeo } from "@/components/seo/PageSeo";
import { PAGE_SEO } from "@/lib/seo";
import type { category, Enrollment } from "@/types";
import { cn } from "@/lib/utils";
import { dashboardPathForRole } from "@/lib/roleHome";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

type SortKey = "popular" | "newest" | "name";

const CategoryExplorer = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicPage = location.pathname === "/explore";

  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [selected, setSelected] = useState<category | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(
    null,
  );

  const enrolledIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of user?.categories || []) {
      ids.add(typeof c === "string" ? c : c._id);
    }
    if (activeEnrollment?.category) {
      const cat = activeEnrollment.category;
      ids.add(typeof cat === "string" ? cat : cat._id);
    }
    return ids;
  }, [user?.categories, activeEnrollment]);

  const activeCategoryId = useMemo(() => {
    if (!activeEnrollment?.category) return null;
    const cat = activeEnrollment.category;
    return typeof cat === "string" ? cat : cat._id;
  }, [activeEnrollment]);

  const activeCategoryName = useMemo(() => {
    if (!activeEnrollment?.category) return null;
    const cat = activeEnrollment.category;
    return typeof cat === "string" ? null : cat.name;
  }, [activeEnrollment]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      setCategories((data.data.categories as category[]) || []);
    } catch (error: unknown) {
      console.error("Failed to load categories:", error);
      toast.error(getErrorMessage(error, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveEnrollment = useCallback(async () => {
    if (!user || user.role !== "student") {
      setActiveEnrollment(null);
      return;
    }
    try {
      const { data } = await api.get("/enrollments/me");
      const enrollments = (data.data.enrollments as Enrollment[]) || [];
      const active =
        enrollments.find((e) => e.status === "active") || null;
      setActiveEnrollment(active);
    } catch {
      setActiveEnrollment(null);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchActiveEnrollment();
  }, [fetchActiveEnrollment]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = categories.filter((cat) => {
      if (!q) return true;
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "newest") {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      }
      return (b.studentCount || 0) - (a.studentCount || 0);
    });

    return list;
  }, [categories, query, sort]);

  const totalStudents = categories.reduce(
    (sum, c) => sum + (c.studentCount || 0),
    0,
  );
  const certCount = categories.filter((c) => c.certificateEnabled !== false)
    .length;

  const isSelectedActive =
    !!selected && !!activeCategoryId && selected._id === activeCategoryId;
  const isSelectedEnrolled = selected
    ? enrolledIds.has(selected._id) || isSelectedActive
    : false;
  const enrollBlockedByFocus =
    !!selected &&
    !!activeCategoryId &&
    selected._id !== activeCategoryId &&
    !!user;

  const handleEnroll = async (cat: category) => {
    if (!user) {
      navigate("/login", { state: { from: `/categories` } });
      return;
    }
    if (user.role !== "student") {
      toast.error("Only students can enroll in categories");
      return;
    }
    if (enrolledIds.has(cat._id) || cat._id === activeCategoryId) {
      navigate("/my-learning");
      return;
    }
    // Already on another active path — open switch flow instead of hard-blocking
    if (activeCategoryId && cat._id !== activeCategoryId) {
      setSwitchOpen(true);
      return;
    }

    setEnrolling(true);
    try {
      await api.post(`/categories/${cat._id}/enroll`, {});
      toast.success(`Enrolled in ${cat.name}`);
      setSelected(null);
      await refreshUser().catch(() => undefined);
      await fetchActiveEnrollment();
      navigate("/my-learning");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to enroll"));
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div
      className={cn(
        "relative min-w-0",
        isPublicPage && "min-h-screen bg-[#FAFAF8]",
      )}
    >
      {isPublicPage && (
        <PageSeo
          title={PAGE_SEO.explore.title}
          description={PAGE_SEO.explore.description}
          path="/explore"
        />
      )}
      {isPublicPage && (
        <header className="sticky top-0 z-40 border-b border-black/5 bg-[#FAFAF8]/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <img
                src="/gygiLogo.jpg"
                alt="GYGI"
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="text-base font-black tracking-tight text-[#1A1A1E]">
                GYGI<span className="text-primary">.</span>
              </span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/register")}
              >
                Join free
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Hero */}
      <section
        className={cn(
          "relative overflow-hidden",
          isPublicPage ? "px-4 pb-10 pt-10 sm:px-6 sm:pt-14" : "mb-6",
        )}
      >
        <div
          className={cn(
            "relative mx-auto overflow-hidden rounded-[1.75rem] sm:rounded-4xl",
            isPublicPage ? "max-w-6xl" : "max-w-none",
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(193,71,233,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(28,28,33,0.08),_transparent_50%),linear-gradient(160deg,#F7F3FF_0%,#FFF8F5_45%,#F4F7FF_100%)]" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-[#1C1C21]/10 blur-3xl" />

          <div className="relative px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-primary sm:text-xs">
                GYGI Learning
              </p>
              <h1 className="text-3xl font-black tracking-tight text-[#1A1A1E] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                Explore Categories
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5A5A62] sm:text-base">
                Choose a learning phase, join live classes, and earn a
                certificate when you complete the journey.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
                <Button
                  className="h-11 rounded-full px-5 shadow-md shadow-primary/20"
                  onClick={() => {
                    document
                      .getElementById("category-search")
                      ?.focus();
                  }}
                >
                  Browse catalog
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                {user?.role === "student" ? (
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-[#1C1C21]/10 bg-white/70 px-5 backdrop-blur"
                    onClick={() => navigate("/my-learning")}
                  >
                    My Learning
                  </Button>
                ) : user ? (
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-[#1C1C21]/10 bg-white/70 px-5 backdrop-blur"
                    onClick={() => navigate(dashboardPathForRole(user.role))}
                  >
                    Go to dashboard
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-[#1C1C21]/10 bg-white/70 px-5 backdrop-blur"
                    onClick={() => navigate("/register")}
                  >
                    Create account
                  </Button>
                )}
              </div>
            </div>

            {/* Ambient stats — below CTA, not competing with brand */}
            <div className="mt-8 flex flex-wrap gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-xs font-medium text-[#1A1A1E] shadow-sm backdrop-blur">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                {categories.length} categories
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-xs font-medium text-[#1A1A1E] shadow-sm backdrop-blur">
                <Users className="h-3.5 w-3.5 text-sky-600" />
                {totalStudents} learners
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-xs font-medium text-[#1A1A1E] shadow-sm backdrop-blur">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                {certCount} with certificates
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className={cn(
          "mx-auto space-y-5 pb-12",
          isPublicPage ? "max-w-6xl px-4 sm:px-6" : "",
        )}
      >
        {activeCategoryId && activeCategoryName ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-950">
                Focused on {activeCategoryName}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">
                Finish this learning phase before enrolling in another category.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full shrink-0 rounded-full border-amber-300 bg-white text-sm font-semibold sm:h-11 sm:w-auto sm:px-5"
              onClick={() => navigate("/my-learning")}
            >
              Continue learning
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="category-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories..."
              className="h-12 rounded-full border-slate-200 bg-white pr-10 pl-11 text-base shadow-none sm:h-11 sm:text-sm"
            />
            {query ? (
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {(
              [
                { id: "popular", label: "Popular" },
                { id: "newest", label: "Newest" },
                { id: "name", label: "A–Z" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSort(option.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition",
                  sort === option.id
                    ? "bg-[#1C1C21] text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            {loading
              ? "Loading catalog…"
              : `${filtered.length} categor${filtered.length === 1 ? "y" : "ies"}`}
            {query.trim() ? ` matching “${query.trim()}”` : ""}
          </p>
          {!loading && filtered.length > 0 ? (
            <p className="hidden items-center gap-1 sm:inline-flex">

              Tap a category to preview & enroll
            </p>
          ) : null}
        </div>

        {loading ? (
          <PageListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={query ? "No matches found" : "No categories available"}
            description={
              query
                ? "Try a different search term or clear the filter"
                : "Categories will appear here once created"
            }
            icon={<FolderTree className="h-8 w-8 text-muted-foreground" />}
            actionLabel={query ? "Clear search" : undefined}
            onAction={query ? () => setQuery("") : undefined}
          />
        ) : (
          <CategoryGrid
            categories={filtered}
            onView={(cat) => setSelected(cat)}
            enrolledIds={enrolledIds}
          />
        )}
      </div>

      {/* Detail / enroll — native bottom sheet */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="bottom"
          className={cn(
            "gap-0 overflow-hidden border-x-0 border-b-0 border-t border-slate-200/80 bg-white p-0 shadow-2xl",
            "h-auto max-h-[92dvh] rounded-t-[1.75rem]",
            "w-full sm:mx-auto sm:max-w-lg",
            // Hide default sheet close — custom button in hero
            "[&>button]:hidden",
          )}
        >
          {selected ? (
            <div className="flex max-h-[min(92dvh,100%)] flex-col">
              {/* Drag handle */}
              <div className="flex shrink-0 justify-center pt-2.5 pb-1">
                <div className="h-1 w-10 rounded-full bg-slate-200" />
              </div>

              {/* Hero */}
              <div className="relative h-36 shrink-0 overflow-hidden bg-linear-to-br from-primary/15 via-[#F7F3FF] to-[#FFF8F5] sm:h-44">
                {selected.bannerImage ? (
                  <img
                    src={selected.bannerImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {selected.icon ? (
                      <span className="text-5xl">{selected.icon}</span>
                    ) : (
                      <BookOpen className="h-12 w-12 text-primary/40" />
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-95 hover:bg-black/55"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute right-4 bottom-3.5 left-4 min-w-0 pr-12">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                    Learning phase
                  </p>
                  <SheetTitle className="mt-1 text-left text-xl font-black leading-tight wrap-break-word text-white sm:text-2xl">
                    {selected.name}
                  </SheetTitle>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-5">
                <div className="space-y-4">
                  <SheetHeader className="space-y-0 p-0 text-left">
                    <SheetDescription className="text-[15px] leading-relaxed wrap-break-word text-pretty text-slate-600 sm:text-sm">
                      {selected.description}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <div className="min-w-0 rounded-2xl bg-slate-50 px-1.5 py-2.5 text-center sm:px-3">
                      <Users className="mx-auto h-3.5 w-3.5 text-sky-600" />
                      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                        {selected.studentCount || 0}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        Students
                      </p>
                    </div>
                    <div className="min-w-0 rounded-2xl bg-slate-50 px-1.5 py-2.5 text-center sm:px-3">
                      <GraduationCap className="mx-auto h-3.5 w-3.5 text-primary" />
                      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                        {selected.tutorCount || 0}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        Tutors
                      </p>
                    </div>
                    <div className="min-w-0 rounded-2xl bg-slate-50 px-1.5 py-2.5 text-center sm:px-3">
                      <HeartHandshake className="mx-auto h-3.5 w-3.5 text-emerald-600" />
                      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                        {selected.mentorCount || 0}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        Mentors
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selected.durationWeeks ? (
                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {selected.durationWeeks}-week phase
                        </span>
                      </span>
                    ) : null}
                    {selected.certificateEnabled !== false ? (
                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-100">
                        <Award className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          Certificate on completion
                        </span>
                      </span>
                    ) : null}
                  </div>

                  {enrollBlockedByFocus ? (
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3.5 py-3 text-[12px] leading-relaxed wrap-break-word text-pretty text-[#2D2D44] sm:text-xs">
                      You&apos;re currently on{" "}
                      <span className="font-semibold">
                        {activeCategoryName || "another category"}
                      </span>
                      . You can switch to{" "}
                      <span className="font-semibold">{selected.name}</span>{" "}
                      — community, classes, and mentorship will follow the new
                      path.
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Sticky footer CTAs — thumb-friendly */}
              <div
                className="shrink-0 border-t border-slate-100 bg-white px-4 pt-3 sm:px-6"
                style={{
                  paddingBottom:
                    "max(1rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="flex flex-col gap-2.5">
                  <Button
                    type="button"
                    className="h-12 w-full rounded-full text-[15px] font-semibold shadow-md shadow-primary/20 active:scale-[0.98] sm:h-11 sm:text-sm"
                    disabled={enrolling}
                    onClick={() => {
                      if (enrollBlockedByFocus) {
                        setSwitchOpen(true);
                        return;
                      }
                      void handleEnroll(selected);
                    }}
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enrolling…
                      </>
                    ) : isSelectedEnrolled || isSelectedActive ? (
                      "Go to My Learning"
                    ) : enrollBlockedByFocus ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Request category change
                      </>
                    ) : user ? (
                      "Enroll now"
                    ) : (
                      "Log in to enroll"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full rounded-full text-[15px] text-slate-600 sm:h-10 sm:text-sm"
                    onClick={() => setSelected(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <CategorySwitchDialog
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        currentCategoryId={activeCategoryId}
        currentCategoryName={activeCategoryName}
        initialCategoryId={selected?._id || null}
        onSwitched={async () => {
          setSelected(null);
          await refreshUser().catch(() => undefined);
          await fetchActiveEnrollment();
        }}
      />
    </div>
  );
};

export default CategoryExplorer;
