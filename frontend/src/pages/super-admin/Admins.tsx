import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  saCard,
  saMainGrid,
  saPageShell,
  saSpan12,
  SaEntityCard,
  SaPageHeader,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubSkeleton } from "@/components/loading/PageSkeleton";

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  capabilities?: string[];
};

const AdminsPage = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/super-admin/admins");
      setAdmins((data.data.admins as AdminUser[]) || []);
      setCapabilities((data.data.capabilities as string[]) || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || "Failed to load admins";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    id: string,
    body: Partial<{ isActive: boolean; role: string; capabilities: string[] }>,
  ) => {
    setSavingId(id);
    try {
      await api.patch(`/super-admin/admins/${id}`, body);
      toast.success("Admin updated");
      await load();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  if (loading && !admins.length && !error) {
    return <SaHubSkeleton />;
  }

  const superCount = admins.filter((a) => a.role === "super_admin").length;
  const inactiveCount = admins.filter((a) => !a.isActive).length;

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow="GYGI Super Admin"
        title="Admin governance"
        subtitle="Promote, suspend, and grant super-admin capabilities (F04). All changes are audited."
      />

      {error && !admins.length ? (
        <div className={cn(saCard, "border-rose-100 bg-rose-50/40")}>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <SaSoftButton tone="primary" className="mt-3" onClick={() => void load()}>
            Retry
          </SaSoftButton>
        </div>
      ) : (
        <div className={saMainGrid}>
          <div className={cn(saSpan12, "grid h-full grid-cols-3 gap-4")}>
            <StatPill label="Admins" value={admins.length} />
            <StatPill label="Super admins" value={superCount} valueClassName="text-primary" />
            <StatPill
              label="Inactive"
              value={inactiveCount}
              valueClassName="text-rose-600"
            />
          </div>

          <div className={cn(saSpan12, "h-full grid gap-5 md:grid-cols-2")}>
          {admins.map((a) => (
            <div key={a._id} className="h-full min-w-0">
              <SaEntityCard
                className="h-full"
                title={a.name}
                meta={a.email}
                tags={[
                  {
                    label: a.role === "super_admin" ? "Super" : a.role,
                    tone:
                      a.role === "super_admin"
                        ? "bg-zinc-900 text-amber-300"
                        : "bg-primary/15 text-primary",
                  },
                  ...(a.isActive
                    ? [{ label: "Active", tone: "bg-emerald-50 text-emerald-700" }]
                    : [{ label: "Suspended", tone: "bg-rose-50 text-rose-700" }]),
                ]}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 ring-2 ring-muted">
                    <AvatarImage src={a.avatar} />
                    <AvatarFallback className="text-xs font-bold">{a.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Active</span>
                    <Switch
                      checked={a.isActive}
                      disabled={savingId === a._id}
                      onCheckedChange={(v) => void patch(a._id, { isActive: v })}
                    />
                  </div>
                </div>
                {a.role === "super_admin" ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {capabilities.map((cap) => {
                      const on = (a.capabilities || []).length
                        ? a.capabilities!.includes(cap)
                        : true;
                      return (
                        <button
                          key={cap}
                          type="button"
                          disabled={savingId === a._id}
                          onClick={() => {
                            const current =
                              (a.capabilities || []).length === 0
                                ? [...capabilities]
                                : [...(a.capabilities || [])];
                            const next = on
                              ? current.filter((c) => c !== cap)
                              : [...current, cap];
                            void patch(a._id, { capabilities: next });
                          }}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold transition",
                            on
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {cap}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </SaEntityCard>
              <div className="mt-2 flex flex-wrap gap-2 px-1">
                {a.role === "admin" ? (
                  <SaSoftButton
                    tone="primary"
                    disabled={savingId === a._id}
                    onClick={() =>
                      void patch(a._id, {
                        role: "super_admin",
                        capabilities,
                      })
                    }
                  >
                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                    Elevate to Super
                  </SaSoftButton>
                ) : null}
                {a.role === "super_admin" ? (
                  <SaSoftButton
                    tone="warn"
                    disabled={savingId === a._id}
                    onClick={() => void patch(a._id, { role: "admin", capabilities: [] })}
                  >
                    Demote to admin
                  </SaSoftButton>
                ) : null}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsPage;
