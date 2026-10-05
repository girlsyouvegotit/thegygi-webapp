import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SaHubSkeleton } from "@/components/loading/PageSkeleton";
import {
  saCard,
  saInput,
  saMainGrid,
  saPageShell,
  saPrimaryBtn,
  saSpan12,
  saSpan6,
  SaDarkPanel,
  SaEntityCard,
  SaPageHeader,
  SaRingCard,
  StatPill,
} from "@/lib/superAdminStyles";

type Flag = {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  roles?: string[];
};

type Control = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  bannerEnabled: boolean;
  bannerMessage?: string;
  bannerTone: "info" | "warning" | "critical";
  featureFlags: Flag[];
};

const OrgPage = () => {
  const [control, setControl] = useState<Control | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/super-admin/org");
      setControl(data.data.control as Control);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || "Failed to load org controls";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!control) return;
    setSaving(true);
    try {
      const { data } = await api.put("/super-admin/org", control);
      setControl(data.data.control as Control);
      toast.success("Platform controls saved");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !control) {
    return <SaHubSkeleton />;
  }

  if (error && !control) {
    return (
      <div className={saPageShell}>
        <SaPageHeader
          eyebrow="GYGI Super Admin"
          title="Org controls"
          subtitle="Maintenance mode, banners, and feature flags (F41–F43)."
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

  if (!control) return null;

  const flagsOn = control.featureFlags.filter((f) => f.enabled).length;
  const flagsTotal = control.featureFlags.length;

  return (
    <div className={saPageShell}>
      <SaPageHeader
        eyebrow="GYGI Super Admin"
        title="Org controls"
        subtitle="Maintenance mode, banners, and feature flags (F41–F43)."
        actions={
          <button type="button" className={saPrimaryBtn} disabled={saving} onClick={() => void save()}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save changes
          </button>
        }
      />

      <div className={saMainGrid}>
        <div className={cn(saSpan6, "h-full")}>
          <SaDarkPanel
            title="Platform mode"
            rows={[
              {
                label: "Maintenance",
                value: control.maintenanceMode ? "ON" : "OFF",
                color: control.maintenanceMode ? "#f43f5e" : "#22c55e",
              },
              {
                label: "Global banner",
                value: control.bannerEnabled ? "Live" : "Hidden",
                color: control.bannerEnabled ? "#c147e9" : "#94a3b8",
              },
              {
                label: "Flags enabled",
                value: `${flagsOn} / ${flagsTotal}`,
                color: "#5B5FEF",
              },
              {
                label: "Banner tone",
                value: control.bannerTone,
                color: "#FF9F43",
              },
            ]}
          />
        </div>

        <div className={cn(saSpan6, "grid h-full grid-cols-1 gap-5")}>
          <SaRingCard
            title="Feature rollout"
            subtitle="Flags on"
            percent={flagsTotal ? (flagsOn / flagsTotal) * 100 : 0}
            tone="primary"
          />
          <StatPill
            label="Active flags"
            value={flagsOn}
            valueClassName="text-emerald-600"
            hint={`${flagsOn} of ${flagsTotal} enabled`}
          />
        </div>

        <section className={cn(saCard, saSpan6, "h-full")}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Maintenance mode</h2>
              <p className="text-sm text-muted-foreground">
                Freeze non-essential access while you operate.
              </p>
            </div>
            <Switch
              checked={control.maintenanceMode}
              onCheckedChange={(v) =>
                setControl((c) => (c ? { ...c, maintenanceMode: v } : c))
              }
            />
          </div>
          <Textarea
            className="mt-4 rounded-2xl border-border bg-muted"
            rows={3}
            value={control.maintenanceMessage || ""}
            onChange={(e) =>
              setControl((c) =>
                c ? { ...c, maintenanceMessage: e.target.value } : c,
              )
            }
            placeholder="Message shown during maintenance…"
          />
        </section>

        <section className={cn(saCard, saSpan6, "h-full")}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Global banner</h2>
              <p className="text-sm text-muted-foreground">
                Broadcast an announcement across dashboards.
              </p>
            </div>
            <Switch
              checked={control.bannerEnabled}
              onCheckedChange={(v) =>
                setControl((c) => (c ? { ...c, bannerEnabled: v } : c))
              }
            />
          </div>
          <input
            className={cn(saInput, "mt-4")}
            value={control.bannerMessage || ""}
            onChange={(e) =>
              setControl((c) =>
                c ? { ...c, bannerMessage: e.target.value } : c,
              )
            }
            placeholder="Banner message…"
          />
          <select
            className={cn(saInput, "mt-3")}
            value={control.bannerTone}
            onChange={(e) =>
              setControl((c) =>
                c
                  ? {
                      ...c,
                      bannerTone: e.target.value as Control["bannerTone"],
                    }
                  : c,
              )
            }
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </section>

        <section className={cn(saCard, saSpan12, "h-full")}>
          <h2 className="text-base font-bold text-foreground">Feature flags</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Toggle capabilities per environment</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:[&>:last-child:nth-child(odd)]:col-span-2">
            {control.featureFlags.map((flag, idx) => (
              <SaEntityCard
                key={flag.key}
                title={flag.label}
                meta={flag.description || flag.key}
                tags={[
                  {
                    label: flag.enabled ? "On" : "Off",
                    tone: flag.enabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-muted-foreground",
                  },
                ]}
                actions={
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(v) =>
                      setControl((c) => {
                        if (!c) return c;
                        const featureFlags = [...c.featureFlags];
                        featureFlags[idx] = { ...featureFlags[idx], enabled: v };
                        return { ...c, featureFlags };
                      })
                    }
                  />
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrgPage;
