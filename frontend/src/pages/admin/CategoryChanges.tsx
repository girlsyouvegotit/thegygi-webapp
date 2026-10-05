import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { TablePageSkeleton } from "@/components/loading/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { categoryChangeRequest } from "@/types";

type StatusFilter = "pending" | "approved" | "rejected" | "cancelled" | "all";

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || fallback;
};

function personName(
  p: categoryChangeRequest["student"] | categoryChangeRequest["reviewedBy"],
): string {
  if (!p) return "—";
  if (typeof p === "string") return p;
  return p.name || p.email || "—";
}

function catName(
  c: categoryChangeRequest["fromCategory"] | categoryChangeRequest["toCategory"],
): string {
  if (!c) return "None";
  if (typeof c === "string") return c;
  return c.name || "—";
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function CategoryChangesPage() {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [requests, setRequests] = useState<categoryChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/enrollments/category-change-requests", {
        params: { status },
      });
      setRequests((data.data?.requests || []) as categoryChangeRequest[]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load requests"));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (
    id: string,
    action: "approve" | "reject",
  ) => {
    setBusyId(id);
    try {
      await api.post(`/enrollments/category-change-requests/${id}/${action}`, {
        reviewNote: notes[id]?.trim() || undefined,
      });
      toast.success(
        action === "approve"
          ? "Category change approved"
          : "Request rejected",
      );
      await load();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          action === "approve"
            ? "Could not approve request"
            : "Could not reject request",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const filters: StatusFilter[] = [
    "pending",
    "approved",
    "rejected",
    "cancelled",
    "all",
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D44]">
            Category change requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review student requests before a category switch takes effect.
            Approvals apply a 30-day lock.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
              status === f
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <TablePageSkeleton />
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
          No {status === "all" ? "" : status} requests.
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => {
            const busy = busyId === req._id;
            const isPending = req.status === "pending";
            return (
              <li
                key={req._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold text-[#2D2D44]">
                      {personName(req.student)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {typeof req.student !== "string" && req.student?.email
                        ? req.student.email
                        : null}
                      {req.createdAt
                        ? ` · ${formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}`
                        : null}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      STATUS_STYLES[req.status] || STATUS_STYLES.cancelled,
                    )}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#2D2D44]">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                    {catName(req.fromCategory)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-primary">
                    {catName(req.toCategory)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {req.reason}
                </p>

                {req.reviewNote ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Review note: {req.reviewNote}
                    {req.reviewedBy
                      ? ` · by ${personName(req.reviewedBy)}`
                      : null}
                  </p>
                ) : null}

                {isPending ? (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <Textarea
                      value={notes[req._id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [req._id]: e.target.value,
                        }))
                      }
                      placeholder="Optional note to the student…"
                      rows={2}
                      maxLength={500}
                      className="resize-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => void review(req._id, "approve")}
                      >
                        {busy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        onClick={() => void review(req._id, "reject")}
                      >
                        {busy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
