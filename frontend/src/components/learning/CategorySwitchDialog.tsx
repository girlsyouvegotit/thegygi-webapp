import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuthContext";
import { cn } from "@/lib/utils";
import type { category, categoryChangeRequest } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MIN_REASON_LENGTH = 30;
const LOCK_DAYS = 30;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCategoryId?: string | null;
  currentCategoryName?: string | null;
  initialCategoryId?: string | null;
  onSwitched?: (categoryId: string) => void;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || fallback;
};

function catName(
  c: categoryChangeRequest["fromCategory"] | categoryChangeRequest["toCategory"],
): string {
  if (!c) return "—";
  if (typeof c === "string") return c;
  return c.name || "—";
}

export default function CategorySwitchDialog({
  open,
  onOpenChange,
  currentCategoryId,
  currentCategoryName,
  initialCategoryId,
  onSwitched,
}: Props) {
  const { user, refreshUser } = useAuth();
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRequest, setPendingRequest] =
    useState<categoryChangeRequest | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const lockActive = useMemo(() => {
    const raw = lockedUntil || user?.categoryChangeLockedUntil || null;
    if (!raw) return false;
    return new Date(raw).getTime() > Date.now();
  }, [lockedUntil, user?.categoryChangeLockedUntil]);

  const lockLabel = useMemo(() => {
    const raw = lockedUntil || user?.categoryChangeLockedUntil || null;
    if (!raw) return null;
    return new Date(raw).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [lockedUntil, user?.categoryChangeLockedUntil]);

  const reasonOk = reason.trim().length >= MIN_REASON_LENGTH;
  const selectedName =
    categories.find((c) => c._id === selectedId)?.name || "that category";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, reqRes] = await Promise.all([
        api.get("/categories"),
        api.get("/enrollments/category-change-requests/me"),
      ]);
      setCategories((catsRes.data.data.categories as category[]) || []);
      const requests = (reqRes.data.data?.requests ||
        []) as categoryChangeRequest[];
      setPendingRequest(
        requests.find((r) => r.status === "pending") || null,
      );
      setLockedUntil(
        (reqRes.data.data?.categoryChangeLockedUntil as string | null) || null,
      );
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Could not load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
    setSelectedId(initialCategoryId || "");
    setReason("");
    setConfirmOpen(false);
  }, [open, initialCategoryId, load]);

  const openConfirm = () => {
    if (!selectedId) {
      toast.error("Select a learning category");
      return;
    }
    if (selectedId === currentCategoryId) {
      toast.message("You’re already on this category");
      return;
    }
    if (!reasonOk) {
      toast.error(
        `Please explain why you want to change (at least ${MIN_REASON_LENGTH} characters).`,
      );
      return;
    }
    if (lockActive) {
      toast.error(
        lockLabel
          ? `You can’t request another change until ${lockLabel}.`
          : "Category changes are temporarily locked.",
      );
      return;
    }
    if (pendingRequest) {
      toast.message("You already have a pending request");
      return;
    }
    setConfirmOpen(true);
  };

  const submitRequest = async () => {
    setSubmitting(true);
    try {
      await api.post("/enrollments/category-change-requests", {
        toCategoryId: selectedId,
        reason: reason.trim(),
      });
      toast.success(
        "Request submitted — an admin must approve it before the change takes effect.",
      );
      await refreshUser().catch(() => undefined);
      onSwitched?.(selectedId);
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Could not submit request"));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPending = async () => {
    if (!pendingRequest) return;
    setCancelling(true);
    try {
      await api.delete(
        `/enrollments/category-change-requests/${pendingRequest._id}`,
      );
      toast.success("Request cancelled");
      setPendingRequest(null);
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Could not cancel request"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#2D2D44]">
              <RefreshCw className="h-4 w-4 text-primary" />
              Request category change
            </DialogTitle>
            <DialogDescription>
              {currentCategoryName
                ? `You’re on ${currentCategoryName}. Changes need admin approval and lock for ${LOCK_DAYS} days once approved.`
                : `Pick a category and explain why. An admin must approve before it takes effect.`}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pendingRequest ? (
            <div className="mt-2 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-bold text-[#2D2D44]">
                    Request pending review
                  </p>
                  <p className="text-xs text-slate-600">
                    Switch to{" "}
                    <span className="font-semibold">
                      {catName(pendingRequest.toCategory)}
                    </span>{" "}
                    is waiting for an admin. You can’t submit another until this
                    is approved, rejected, or cancelled.
                  </p>
                  <p className="pt-1 text-xs text-slate-500">
                    Your reason: {pendingRequest.reason}
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={cancelling}
                  onClick={() => void cancelPending()}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling…
                    </>
                  ) : (
                    "Cancel request"
                  )}
                </Button>
              </div>
            </div>
          ) : lockActive ? (
            <div className="mt-2 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                <div>
                  <p className="text-sm font-bold text-[#2D2D44]">
                    Category change locked
                  </p>
                  <p className="text-xs text-slate-600">
                    After an approved change you can’t request another until{" "}
                    <span className="font-semibold">{lockLabel}</span> (
                    {LOCK_DAYS}-day lock).
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No categories available right now.
            </p>
          ) : (
            <>
              <div className="mt-2 max-h-[14rem] space-y-2 overflow-y-auto pr-0.5">
                {categories.map((cat) => {
                  const selected = selectedId === cat._id;
                  const isCurrent = cat._id === currentCategoryId;
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setSelectedId(cat._id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                        selected
                          ? "border-primary/50 bg-primary/10 ring-1 ring-primary/25"
                          : "border-slate-200 bg-white hover:border-primary/30 hover:bg-[#F7F6FB]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          selected
                            ? "bg-gradient-to-br from-[#c147e9] to-[#5B5FEF] text-white"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#2D2D44]">
                          {cat.name}
                          {isCurrent ? (
                            <span className="ml-2 text-[10px] font-bold tracking-wide text-primary uppercase">
                              Current
                            </span>
                          ) : null}
                        </p>
                        <p className="line-clamp-1 text-xs text-slate-500">
                          {cat.description}
                        </p>
                      </div>
                      {selected ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2">
                <label
                  htmlFor="category-change-reason"
                  className="text-sm font-semibold text-[#2D2D44]"
                >
                  Why do you want to change?
                </label>
                <Textarea
                  id="category-change-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Share a clear reason (career goals, better fit, schedule, etc.) — at least 30 characters."
                  rows={4}
                  maxLength={1000}
                  className="resize-none"
                />
                <p
                  className={cn(
                    "text-xs",
                    reasonOk ? "text-slate-500" : "text-amber-700",
                  )}
                >
                  {reason.trim().length}/{MIN_REASON_LENGTH} characters minimum
                </p>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={openConfirm}
                  disabled={
                    submitting ||
                    !selectedId ||
                    selectedId === currentCategoryId ||
                    !reasonOk
                  }
                  className="bg-primary hover:bg-primary/90"
                >
                  Continue
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This can’t be undone for {LOCK_DAYS} days</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You’re requesting a switch to{" "}
                <strong className="text-foreground">{selectedName}</strong>. An
                admin or super admin must approve it before it takes effect.
              </span>
              <span className="block">
                Once approved, you{" "}
                <strong className="text-foreground">
                  cannot change category again for {LOCK_DAYS} days
                </strong>
                . This prevents random switches — only continue if you’re sure.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Go back</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                void submitRequest();
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "I understand — submit request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
