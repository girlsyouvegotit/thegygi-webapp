import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Loader2,
  LayoutDashboard,
  Users,
  FolderTree,
  Video,
  PlayCircle,
  FileQuestion,
  FileText,
  Calendar,
  Target,
  StickyNote,
  MessageSquare,
  Banknote,
  Receipt,
  Wallet,
  Award,
  Bell,
  Activity,
  MessagesSquare,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuthContext";
import { navPathForRole } from "@/lib/roleHome";

export type WorkspaceSearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
  badge?: string;
};

const TYPE_ICON: Record<string, typeof Search> = {
  page: LayoutDashboard,
  user: Users,
  category: FolderTree,
  class: Video,
  recording: PlayCircle,
  quiz: FileQuestion,
  assignment: FileText,
  session: Calendar,
  goal: Target,
  note: StickyNote,
  feedback: MessageSquare,
  fee: Banknote,
  expense: Receipt,
  salary: Wallet,
  certificate: Award,
  notification: Bell,
  activity: Activity,
  community: MessagesSquare,
};

function groupResults(results: WorkspaceSearchResult[]) {
  const order = [
    "page",
    "user",
    "category",
    "class",
    "recording",
    "quiz",
    "assignment",
    "session",
    "goal",
    "note",
    "feedback",
    "certificate",
    "fee",
    "expense",
    "salary",
    "notification",
    "activity",
    "community",
  ];
  const map = new Map<string, WorkspaceSearchResult[]>();
  for (const r of results) {
    const list = map.get(r.type) || [];
    list.push(r);
    map.set(r.type, list);
  }
  return order
    .filter((t) => map.has(t))
    .map((t) => ({ type: t, items: map.get(t)! }));
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    page: "Pages",
    user: "People",
    category: "Categories",
    class: "Classes",
    recording: "Recordings",
    quiz: "Quizzes",
    assignment: "Assignments",
    session: "Sessions",
    goal: "Goals",
    note: "Notes",
    feedback: "Feedback",
    fee: "Fees",
    expense: "Expenses",
    salary: "Salaries",
    certificate: "Certificates",
    notification: "Notifications",
    activity: "Activity",
    community: "Community",
  };
  return labels[type] || type;
}

export function WorkspaceSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WorkspaceSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const { data } = await api.get("/search", {
          params: { q: debounced },
        });
        if (cancelled) return;
        setResults((data.data?.results as WorkspaceSearchResult[]) || []);
        setActiveIndex(0);
        setOpen(true);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flat = results;
  const groups = useMemo(() => groupResults(results), [results]);

  const go = useCallback(
    (item: WorkspaceSearchResult) => {
      setOpen(false);
      setQuery("");
      setDebounced("");
      setResults([]);
      navigate(navPathForRole(user?.role, item.href));
    },
    [navigate, user?.role],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
      setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      setOpen(true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item) go(item);
    }
  };

  const showPanel = open && debounced.length > 0;

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Search your workspace"
        aria-label="Search your workspace"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showPanel}
        role="combobox"
        className="h-10 w-full rounded-full border-border bg-muted/50 pl-10 pr-14 shadow-inner transition-colors placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
      />
      {loading ? (
        <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline-flex">
          ⌘K
        </span>
      )}

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(28rem,70vh)] overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
        >
          <div className="max-h-[min(28rem,70vh)] overflow-y-auto overscroll-contain p-2">
            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching workspace…
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No matches for “{debounced}”
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try people, classes, quizzes, fees, pages — anything in your
                  workspace
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.type} className="mb-1">
                  <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {typeLabel(group.type)}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const flatIndex = flat.findIndex(
                        (r) => r.id === item.id && r.type === item.type,
                      );
                      const Icon = TYPE_ICON[item.type] || Search;
                      const active = flatIndex === activeIndex;
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                            onClick={() => go(item)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition",
                              active
                                ? "bg-primary/10 text-slate-900"
                                : "hover:bg-muted/70",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                active
                                  ? "bg-primary text-white"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900">
                                {item.title}
                              </span>
                              {item.subtitle ? (
                                <span className="block truncate text-[11px] text-slate-500">
                                  {item.subtitle}
                                </span>
                              ) : null}
                            </span>
                            {item.badge ? (
                              <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 sm:inline">
                                {item.badge}
                              </span>
                            ) : null}
                            <ArrowRight
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-slate-300",
                                active && "text-primary",
                              )}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border bg-muted/40 px-3 py-2 text-[10px] font-medium text-slate-400">
            ↑↓ navigate · Enter open · Esc close · ⌘K focus
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default WorkspaceSearch;
