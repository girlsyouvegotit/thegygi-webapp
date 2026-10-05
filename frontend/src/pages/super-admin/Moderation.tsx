import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaPageSkeleton } from "@/components/loading/PageSkeleton";
import {
  saCard,
  saInput,
  saPageShell,
  saPrimaryBtn,
  SaPageHeader,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { cn } from "@/lib/utils";

type Target = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  moderationStatus?: string;
  strikeCount?: number;
};

type ActionRow = {
  _id: string;
  type: string;
  reason: string;
  severity?: string;
  createdAt: string;
  targetUser?: { name?: string; email?: string; avatar?: string };
  actor?: { name?: string };
};

type Overview = {
  stats: {
    warned: number;
    suspended: number;
    banned: number;
    muted: number;
    warnings30d: number;
  };
  recentActions: ActionRow[];
  strikeLeaders: Target[];
};

type ActionKind = "message" | "warn" | "suspend" | "ban" | "unsuspend" | "unban";

const SuperAdminModeration = () => {
  const [params, setParams] = useSearchParams();
  const initialAction = (params.get("action") as ActionKind) || "warn";

  const [overview, setOverview] = useState<Overview | null>(null);
  const [q, setQ] = useState("");
  const [targets, setTargets] = useState<Target[]>([]);
  const [selected, setSelected] = useState<Target | null>(null);
  const [action, setAction] = useState<ActionKind>(initialAction);
  const [reason, setReason] = useState("");
  const [title, setTitle] = useState("Message from GYGI");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("7d");
  const [severity, setSeverity] = useState("warning");
  const [internalNote, setInternalNote] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    try {
      const { data } = await api.get("/super-admin/moderation/overview");
      setOverview(data.data);
    } catch {
      toast.error("Failed to load moderation overview");
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async () => {
    try {
      const { data } = await api.get("/super-admin/moderation/targets", {
        params: { q },
      });
      setTargets(data.data.items || []);
    } catch {
      toast.error("Search failed");
    }
  }, [q]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const t = window.setTimeout(() => void search(), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const a = params.get("action") as ActionKind | null;
    if (a) setAction(a);
  }, [params]);

  const canSubmit = useMemo(() => {
    if (!selected) return false;
    if (action === "ban" && confirmEmail.trim() !== selected.email) return false;
    if (action === "message") return Boolean(title.trim() && message.trim());
    if (action === "unsuspend" || action === "unban") return true;
    return Boolean(reason.trim());
  }, [selected, action, confirmEmail, title, message, reason]);

  const submit = async () => {
    if (!selected || !canSubmit) return;
    setBusy(true);
    try {
      const id = selected._id;
      if (action === "message") {
        await api.post(`/super-admin/moderation/users/${id}/message`, {
          title,
          message,
          reason: reason || "Official message",
          internalNote,
        });
        toast.success("Message sent");
      } else if (action === "warn") {
        await api.post(`/super-admin/moderation/users/${id}/warn`, {
          reason,
          severity,
          messageBody: message || undefined,
          internalNote,
        });
        toast.success("Warning issued");
      } else if (action === "suspend") {
        await api.post(`/super-admin/moderation/users/${id}/suspend`, {
          reason,
          duration,
          internalNote,
        });
        toast.success("Account suspended");
      } else if (action === "unsuspend") {
        await api.post(`/super-admin/moderation/users/${id}/unsuspend`, {
          reason: reason || "Suspension lifted",
          internalNote,
        });
        toast.success("Account unsuspended");
      } else if (action === "ban") {
        await api.post(`/super-admin/moderation/users/${id}/ban`, {
          reason,
          internalNote,
        });
        toast.success("Account banned");
      } else if (action === "unban") {
        await api.post(`/super-admin/moderation/users/${id}/unban`, {
          reason: reason || "Ban lifted",
          internalNote,
        });
        toast.success("Account unbanned");
      }
      setReason("");
      setMessage("");
      setInternalNote("");
      setConfirmEmail("");
      void loadOverview();
      void search();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !overview) {
    return <SaPageSkeleton />;
  }

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow="Enforcement"
        title="Moderation desk"
        subtitle="Official messages, warnings, suspensions, and bans — fully audited."
        actions={<ShieldAlert className="hidden h-8 w-8 text-[#c147e9] sm:block" />}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6 xl:grid-cols-5">
        <StatPill
          className="md:col-span-2 xl:col-span-1"
          label="Warned"
          value={overview?.stats.warned ?? 0}
        />
        <StatPill
          className="md:col-span-2 xl:col-span-1"
          label="Suspended"
          value={overview?.stats.suspended ?? 0}
          valueClassName="text-amber-700"
        />
        <StatPill
          className="md:col-span-2 xl:col-span-1"
          label="Banned"
          value={overview?.stats.banned ?? 0}
          valueClassName="text-rose-700"
        />
        <StatPill
          className="md:col-span-3 xl:col-span-1"
          label="Muted"
          value={overview?.stats.muted ?? 0}
        />
        <StatPill
          className="md:col-span-3 xl:col-span-1"
          label="Warnings (30d)"
          value={overview?.stats.warnings30d ?? 0}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12 md:gap-6 xl:gap-7">
        {/* Targets */}
        <section className={cn(saCard, "md:col-span-12 xl:col-span-4")}>
          <h2 className="text-base font-bold text-foreground">Find a person</h2>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className={cn(saInput, "pl-10")}
            />
          </div>
          <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
            {targets.map((t) => (
              <li key={t._id}>
                <button
                  type="button"
                  onClick={() => setSelected(t)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition",
                    selected?._id === t._id
                      ? "bg-primary/15 ring-1 ring-[#c147e9]/30"
                      : "bg-muted hover:bg-muted",
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={t.avatar} />
                    <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.email} · {t.role}
                    </p>
                  </div>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground capitalize">
                    {t.moderationStatus || "clear"}
                  </span>
                </button>
              </li>
            ))}
            {!targets.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No matches
              </p>
            ) : null}
          </ul>
        </section>

        {/* Action form */}
        <section className={cn(saCard, "md:col-span-12 xl:col-span-5")}>
          <h2 className="text-base font-bold text-foreground">Apply action</h2>
          <p className="text-sm text-muted-foreground">
            {selected
              ? `Target: ${selected.name}`
              : "Select a person from the list"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["message", "Message", "primary"],
                ["warn", "Warn", "warn"],
                ["suspend", "Suspend", "warn"],
                ["unsuspend", "Unsuspend", "success"],
                ["ban", "Ban", "danger"],
                ["unban", "Unban", "success"],
              ] as const
            ).map(([key, label, tone]) => (
              <SaSoftButton
                key={key}
                tone={tone}
                className={cn(
                  action === key && "ring-2 ring-[#c147e9]/40",
                )}
                onClick={() => {
                  setAction(key);
                  setParams({ action: key });
                }}
              >
                {label}
              </SaSoftButton>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {action === "message" ? (
              <>
                <input
                  className={saInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                />
                <textarea
                  className={cn(saInput, "min-h-28 py-3")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Official message…"
                />
              </>
            ) : null}

            {action === "warn" ? (
              <>
                <select
                  className={saInput}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="notice">Notice</option>
                  <option value="warning">Warning</option>
                  <option value="final_warning">Final warning</option>
                  <option value="critical">Critical</option>
                </select>
                <textarea
                  className={cn(saInput, "min-h-20 py-3")}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (shown to user)…"
                />
              </>
            ) : null}

            {action === "suspend" ? (
              <>
                <select
                  className={saInput}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="1d">1 day</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="indefinite">Indefinite</option>
                </select>
                <textarea
                  className={cn(saInput, "min-h-20 py-3")}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Suspension reason…"
                />
              </>
            ) : null}

            {(action === "ban" || action === "unban") && (
              <textarea
                className={cn(saInput, "min-h-20 py-3")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  action === "ban" ? "Ban reason…" : "Reason for lifting ban…"
                }
              />
            )}

            {action === "unsuspend" ? (
              <textarea
                className={cn(saInput, "min-h-16 py-3")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional note…"
              />
            ) : null}

            {action === "ban" ? (
              <input
                className={saInput}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={`Type ${selected?.email || "email"} to confirm ban`}
              />
            ) : null}

            <textarea
              className={cn(saInput, "min-h-16 py-3")}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Internal note (staff only)…"
            />

            <button
              type="button"
              disabled={!canSubmit || busy}
              className={saPrimaryBtn}
              onClick={() => void submit()}
            >
              {busy ? "Working…" : `Confirm ${action}`}
            </button>
          </div>
        </section>

        {/* Recent + strikes */}
        <section className={cn(saCard, "md:col-span-12 xl:col-span-3")}>
          <h2 className="text-base font-bold text-foreground">Recent actions</h2>
          <ul className="mt-4 max-h-[20rem] space-y-3 overflow-y-auto">
            {(overview?.recentActions || []).map((a) => (
              <li
                key={a._id}
                className="rounded-2xl bg-muted px-3 py-2.5 ring-1 ring-border"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold capitalize text-foreground">
                    {a.type}
                  </p>
                  <SaSoftButton
                    tone={
                      a.type === "ban" || a.type === "suspend"
                        ? "danger"
                        : a.type === "warning"
                          ? "warn"
                          : "primary"
                    }
                  >
                    {a.severity || a.type}
                  </SaSoftButton>
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {a.targetUser?.name} ·{" "}
                  {formatDistanceToNow(new Date(a.createdAt), {
                    addSuffix: true,
                  })}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                  {a.reason}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-bold text-foreground">
            Strike leaders
          </h3>
          <ul className="mt-2 space-y-3">
            {(overview?.strikeLeaders || []).map((s) => (
              <li
                key={s._id}
                className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm"
              >
                <span className="truncate font-medium">{s.name}</span>
                <span className="font-black text-amber-700">
                  {s.strikeCount}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminModeration;
