import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthContext";
import { Users, Search, Mail} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { user, category } from "@/types";
import EmptyState from "@/components/global/EmptyState";
import { cn } from "@/lib/utils";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";

type RosterStudent = user & {
  categories?: category[] | string[];
};

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

const categoryLabels = (student: RosterStudent): string[] => {
  const cats = student.categories;
  if (!Array.isArray(cats) || cats.length === 0) return [];
  return cats
    .map((c) => (typeof c === "string" ? null : c?.name))
    .filter((name): name is string => Boolean(name));
};

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?._id) return;

    let cancelled = false;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(
          `/analytics/tutor/${user._id}/students`,
        );
        if (!cancelled) {
          setStudents((data.data.students as RosterStudent[]) || []);
        }
      } catch (error: unknown) {
        console.error("Failed to load students:", error);
        if (!cancelled) {
          setStudents([]);
          toast.error(getErrorMessage(error, "Failed to load students"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchStudents();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const names = categoryLabels(s).join(" ").toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        names.includes(q)
      );
    });
  }, [students, searchQuery]);

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 pb-6">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-32 h-48 w-48 rounded-full bg-fuchsia-200/25 blur-3xl" />
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Roster
            </p>
            <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">
              Students
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Learners enrolled in your categories
            </p>
          </div>
        </div>
        <Badge className="w-fit shrink-0 border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shadow-none">
          {students.length} enrolled
        </Badge>
      </header>

      {students.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-2xl border-slate-200/80 bg-white pl-11 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.35)] focus-visible:ring-primary/20 sm:rounded-full"
          />
        </div>
      )}

      {students.length === 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
          <EmptyState
            title="No students yet"
            description="Students appear here once they enroll in a category you teach"
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
          />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            No students match &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => {
            const labels = categoryLabels(student);
            return (
              <article
                key={student._id}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4",
                  "shadow-[0_8px_30px_-22px_rgba(15,23,42,0.28)] transition-all duration-200",
                  "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)]",
                )}
              >
                <Avatar className="h-12 w-12 border-2 border-primary/15 shadow-sm">
                  <AvatarImage src={student.avatar} alt={student.name} />
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {student.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <Mail className="h-3 w-3 shrink-0 text-primary/60" />
                    {student.email}
                  </p>
                  {labels.length > 0 ? (
                    <p className="mt-1.5 truncate text-[11px] font-medium text-slate-400">
                      {labels.join(" · ")}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Students;
