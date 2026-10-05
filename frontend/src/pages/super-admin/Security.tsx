import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skel } from "@/components/loading/PageSkeleton";
import {
  saCard,
  saCardTight,
  saInput,
  saMainGrid,
  saPageShell,
  saSpan4,
  saSpan8,
  SaDarkPanel,
  SaPageHeader,
  SaRingCard,
  StatPill,
} from "@/lib/superAdminStyles";

const SecurityPage = () => {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<
    Array<{
      _id: string;
      action: string;
      details?: string;
      isAudit?: boolean;
      createdAt: string;
      ipAddress?: string;
      user?: { name?: string; email?: string; avatar?: string; role?: string };
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/super-admin/security", {
        params: { q, auditOnly: true, limit: 50 },
      });
      setItems(data.data.items || []);
    } catch {
      toast.error("Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
  }, [load]);

  const auditCount = items.filter((a) => a.isAudit).length;

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow="GYGI Super Admin"
        title="Security & audit"
        subtitle="Immutable-ish audit stream for dangerous and privileged actions (F07)."
      />

      <div className={saMainGrid}>
        <div className={cn(saSpan4, "h-full")}>
          <SaDarkPanel
            title="Audit stream"
            rows={[
              { label: "Events loaded", value: items.length, color: "#c147e9" },
              { label: "Flagged AUDIT", value: auditCount, color: "#5B5FEF" },
              {
                label: "Unique actors",
                value: new Set(items.map((a) => a.user?.email).filter(Boolean)).size,
                color: "#22c55e",
              },
              {
                label: "With IP",
                value: items.filter((a) => a.ipAddress).length,
                color: "#FF9F43",
              },
            ]}
          />
        </div>

        <div className={cn(saSpan4, "h-full grid gap-5")}>
          <SaRingCard
            title="Audit density"
            subtitle="AUDIT-tagged share"
            percent={items.length ? (auditCount / items.length) * 100 : 0}
            tone="blue"
          />
          <StatPill label="Results (max 50)" value={items.length} />
        </div>

        <div className={cn(saSpan4, "h-full")}>
          <div className={saCardTight}>
            <p className="text-xs font-bold text-muted-foreground uppercase">Filter</p>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter actions…"
                className={cn(saInput, "pl-10")}
              />
            </div>
          </div>
        </div>

        <section className={cn(saCard, saSpan8, "xl:col-span-12")}>
          <h2 className="text-base font-bold text-foreground">Live audit feed</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Privileged actions · newest first
          </p>

          {loading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl bg-muted px-4 py-3.5">
                  <Skel className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skel className="h-3 w-2/3" />
                    <Skel className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 max-h-[36rem] space-y-3 overflow-y-auto pr-1">
              {items.map((a) => (
                <div
                  key={a._id}
                  className="flex items-start gap-4 rounded-2xl bg-muted px-4 py-3.5 ring-1 ring-border"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={a.user?.avatar} />
                    <AvatarFallback className="text-[10px] font-bold">
                      {a.user?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-foreground">{a.action}</p>
                      {a.isAudit ? (
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                          AUDIT
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.user?.name} ({a.user?.role}) ·{" "}
                      {formatDistanceToNow(new Date(a.createdAt), {
                        addSuffix: true,
                      })}
                      {a.ipAddress ? ` · ${a.ipAddress}` : ""}
                    </p>
                    {a.details ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">{a.details}</p>
                    ) : null}
                  </div>
                </div>
              ))}
              {!items.length ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No audit events yet</p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SecurityPage;
