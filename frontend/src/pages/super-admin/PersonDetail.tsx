import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaHubSkeleton } from "@/components/loading/PageSkeleton";
import {
  money,
  saCard,
  saMainGrid,
  saPageShell,
  saPrimaryBtn,
  saSpan4,
  saSpan12,
  SaEntityCard,
  SaPageHeader,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { cn } from "@/lib/utils";

const PersonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { beginImpersonation } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewAsBusy, setViewAsBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`/super-admin/people/${id}`);
      setData(res.data);
    } catch {
      setError("Failed to load dossier");
      toast.error("Failed to load dossier");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <SaHubSkeleton />;
  }

  if (error && !data) {
    return (
      <div className={saPageShell}>
        <SaPageHeader
          eyebrow="People intelligence"
          title="Person dossier"
          subtitle="Could not load this profile."
        />
        <div className={cn(saCard, "border-rose-100 bg-rose-50/40")}>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button type="button" className={cn(saPrimaryBtn, "mt-4")} onClick={() => void load()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const user = data.user as {
    name: string;
    email: string;
    role: string;
    avatar?: string;
    bio?: string;
    isActive: boolean;
    createdAt?: string;
    lastLoginAt?: string;
  };
  const fees =
    (data.fees as Array<{ amount: number; status: string; dueDate: string }>) ||
    [];
  const activity =
    (data.activity as Array<{ action: string; createdAt: string }>) || [];
  const enrollments =
    (data.enrollments as Array<{
      status: string;
      category?: { name?: string };
    }>) || [];

  const runAction = async (action: string, label: string) => {
    if (!id) return;
    try {
      const { data: res } = await api.post(`/super-admin/people/${id}/${action}`);
      toast.success(label);
      if (res.data?.resetToken) {
        toast.message(`Reset token: ${res.data.resetToken}`);
      }
      void load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const viewAs = async () => {
    if (!id) return;
    setViewAsBusy(true);
    try {
      const home = await beginImpersonation(id);
      toast.success(`Now acting as ${user.name}`);
      navigate(home);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "View as failed");
    } finally {
      setViewAsBusy(false);
    }
  };

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow="People intelligence"
        title={user.name}
        subtitle={`${user.email} · ${user.role}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {user.role !== "super_admin" ? (
              <SaSoftButton
                tone="primary"
                disabled={viewAsBusy}
                onClick={() => void viewAs()}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                {viewAsBusy ? "Starting…" : "View as"}
              </SaSoftButton>
            ) : null}
            <SaSoftButton onClick={() => navigate("/super-admin/people")}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Back
            </SaSoftButton>
          </div>
        }
      />

      <div className={saMainGrid}>
        <section className={cn(saCard, saSpan12, "h-full")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16 border-2 border-white shadow">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xl font-black">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {user.role}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                    user.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700",
                  )}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {user.bio ? (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{user.bio}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Joined{" "}
                {user.createdAt
                  ? format(new Date(user.createdAt), "MMM d, yyyy")
                  : "—"}{" "}
                · Last login{" "}
                {user.lastLoginAt
                  ? format(new Date(user.lastLoginAt), "MMM d, yyyy h:mm a")
                  : "—"}
              </p>
            </div>
          </div>

          {user.role !== "super_admin" ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <SaSoftButton
                tone="primary"
                onClick={() =>
                  void runAction("force-password-reset", "Password reset issued")
                }
              >
                Force password reset
              </SaSoftButton>
              <SaSoftButton onClick={() => void runAction("unlock", "Account unlocked")}>
                Unlock
              </SaSoftButton>
              <SaSoftButton
                onClick={() =>
                  void runAction("override-photo-lock", "Photo lock cleared")
                }
              >
                Override photo lock
              </SaSoftButton>
              <SaSoftButton
                tone="warn"
                onClick={() => void runAction("revoke-sessions", "Sessions revoked")}
              >
                Revoke sessions
              </SaSoftButton>
              <SaSoftButton
                tone={user.isActive ? "danger" : "success"}
                onClick={() =>
                  void runAction(
                    user.isActive ? "soft-delete" : "restore",
                    user.isActive ? "Soft-deleted" : "Restored",
                  )
                }
              >
                {user.isActive ? "Soft-delete" : "Restore"}
              </SaSoftButton>
              <button
                type="button"
                className={saPrimaryBtn}
                onClick={() => navigate(`/super-admin/moderation?action=warn`)}
              >
                Warn / Suspend / Ban
              </button>
            </div>
          ) : null}
        </section>

        <div className={cn(saSpan4, "h-full grid gap-5")}>
          <StatPill label="Enrollments" value={enrollments.length} />
          <StatPill label="Fees on file" value={fees.length} />
          <StatPill label="Activity rows" value={activity.length} />
        </div>

        <div className={cn(saSpan4)}>
          <SaEntityCard title="Enrollments" meta="Programs & status">
            <ul className="space-y-4">
              {enrollments.map((e, i) => (
                <li
                  key={i}
                  className="flex justify-between rounded-xl bg-muted px-3 py-2 text-sm"
                >
                  <span>{e.category?.name || "Category"}</span>
                  <span className="font-semibold">{e.status}</span>
                </li>
              ))}
              {!enrollments.length ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : null}
            </ul>
          </SaEntityCard>
        </div>

        <div className={cn(saSpan4)}>
          <SaEntityCard title="Fees" meta="Recent balances">
            <ul className="space-y-4">
              {fees.slice(0, 8).map((f, i) => (
                <li
                  key={i}
                  className="flex justify-between rounded-xl bg-muted px-3 py-2 text-sm"
                >
                  <span>{money(f.amount)}</span>
                  <span className="font-semibold">{f.status}</span>
                </li>
              ))}
              {!fees.length ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : null}
            </ul>
          </SaEntityCard>
        </div>

        <section className={cn(saCard, saSpan12, "h-full")}>
          <h2 className="mb-3 text-base font-bold text-foreground">Recent activity</h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {activity.slice(0, 9).map((a, i) => (
              <div key={i} className="rounded-2xl bg-muted px-3 py-2.5 text-sm">
                <p className="font-semibold text-foreground">{a.action}</p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(a.createdAt), "MMM d · h:mm a")}
                </p>
              </div>
            ))}
            {!activity.length ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PersonDetailPage;
