import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  saCard,
  saInput,
  saMainGrid,
  saPrimaryBtn,
  saSpan12,
  saSpan4,
  saSpan5,
  saSpan6,
  saSpan7,
  saSpan8,
  SaDarkPanel,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";
import { SUPER_ADMIN_FEATURE_CATALOG } from "@/lib/superAdminNav";
import { cn } from "@/lib/utils";

type SystemHub = {
  scheduledMaintenance?: {
    enabled: boolean;
    startsAt?: string;
    endsAt?: string;
    message?: string;
  };
  killSwitches?: Array<{ key: string; label: string; enabled: boolean }>;
  featureFlags?: Array<{
    key: string;
    label: string;
    enabled: boolean;
    rolloutPercent?: number;
  }>;
  experiments?: Array<{ key: string; label: string; enabled: boolean }>;
  staffChangelog?: Array<{
    version: string;
    title: string;
    body: string;
    publishedAt?: string;
  }>;
  reportPresets?: Array<{ key: string; label: string; description?: string }>;
  webhooks?: Array<{ name: string; url: string; enabled: boolean }>;
};

export default function SystemPage() {
  const { data, loading, error, reload } = useSaHub<SystemHub>(
    "/super-admin/system",
    "Failed to load system hub",
  );
  const [maintMsg, setMaintMsg] = useState("");
  const [changelogTitle, setChangelogTitle] = useState("");
  const [changelogBody, setChangelogBody] = useState("");
  const [changelogVersion, setChangelogVersion] = useState("");
  const [reportOut, setReportOut] = useState<string>("");

  useEffect(() => {
    if (data?.scheduledMaintenance?.message) {
      setMaintMsg(data.scheduledMaintenance.message);
    }
  }, [data]);

  const saveMaintenance = async (enabled: boolean) => {
    try {
      await api.put("/super-admin/system", {
        scheduledMaintenance: {
          enabled,
          message: maintMsg,
          startsAt: enabled ? new Date().toISOString() : undefined,
          endsAt: enabled
            ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            : undefined,
        },
      });
      toast.success(enabled ? "Maintenance window armed" : "Window cleared");
      void reload();
    } catch {
      toast.error("Failed to update maintenance window");
    }
  };

  const toggleKill = async (key: string, enabled: boolean) => {
    const next = (data?.killSwitches || []).map((k) =>
      k.key === key ? { ...k, enabled } : k,
    );
    try {
      await api.put("/super-admin/system", { killSwitches: next });
      toast.success("Kill-switch updated");
      void reload();
    } catch {
      toast.error("Update failed");
    }
  };

  const setRollout = async (key: string, percent: number) => {
    try {
      await api.patch(`/super-admin/org/flags/${key}/rollout`, { percent });
      toast.success(`Rollout ${percent}%`);
      void reload();
    } catch {
      toast.error("Rollout update failed");
    }
  };

  const publishChangelog = async () => {
    if (!changelogVersion || !changelogTitle) {
      toast.error("Version and title required");
      return;
    }
    const entry = {
      version: changelogVersion,
      title: changelogTitle,
      body: changelogBody,
      publishedAt: new Date().toISOString(),
    };
    try {
      await api.put("/super-admin/system", {
        staffChangelog: [entry, ...(data?.staffChangelog || [])].slice(0, 40),
      });
      toast.success("Changelog published");
      setChangelogBody("");
      setChangelogTitle("");
      setChangelogVersion("");
      void reload();
    } catch {
      toast.error("Publish failed");
    }
  };

  const runReport = async (key: string) => {
    try {
      const { data: res } = await api.post(`/super-admin/system/reports/${key}`);
      setReportOut(JSON.stringify(res.data, null, 2));
      toast.success(`Report ${key} ready`);
    } catch {
      toast.error("Report failed");
    }
  };

  const killsOn =
    data?.killSwitches?.filter((k) => k.enabled).length ?? 0;
  const maintOn = data?.scheduledMaintenance?.enabled;

  return (
    <SaHubShell
      title="System controls"
      subtitle="Maintenance windows, kill-switches, rollouts, changelog, reports (F41–F43, F49–F50)."
      loading={loading && !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Control surface"
              rows={[
                {
                  label: "Kill-switches armed",
                  value: killsOn,
                  color: "#f43f5e",
                },
                {
                  label: "Feature flags",
                  value: data.featureFlags?.length || 0,
                  color: "#c147e9",
                },
                {
                  label: "Changelog entries",
                  value: data.staffChangelog?.length || 0,
                  color: "#5B5FEF",
                },
                {
                  label: "Report presets",
                  value: data.reportPresets?.length || 0,
                  color: "#22c55e",
                },
              ]}
            />
          </div>

          <div className={cn(saSpan8, "h-full grid gap-4 md:grid-cols-2")}>
            <StatPill
              label="Experiments"
              value={data.experiments?.length || 0}
              hint="A/B toggles"
            />
            <StatPill
              label="Webhooks"
              value={data.webhooks?.length || 0}
              hint="Outbound hooks"
            />
            <StatPill
              label="Maintenance"
              value={maintOn ? "ARMED" : "Clear"}
              valueClassName={maintOn ? "text-rose-600" : undefined}
              hint="F41 window"
            />
            <StatPill
              label="Catalog features"
              value={SUPER_ADMIN_FEATURE_CATALOG.length}
              hint="Reference map"
            />
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Scheduled maintenance" hint="F41">
              <div className="space-y-4">
                <Textarea
                  value={maintMsg}
                  onChange={(e) => setMaintMsg(e.target.value)}
                  placeholder="Maintenance message shown to users"
                  className="min-h-[100px] rounded-2xl border-border bg-muted"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={saPrimaryBtn}
                    onClick={() => void saveMaintenance(true)}
                  >
                    Arm 2h window
                  </button>
                  <SaSoftButton onClick={() => void saveMaintenance(false)}>
                    Clear window
                  </SaSoftButton>
                </div>
              </div>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Module kill-switches" hint="F42">
              <ul className="max-h-80 space-y-3 overflow-y-auto">
                {(data.killSwitches || []).map((k) => (
                  <li
                    key={k.key}
                    className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3.5 ring-1 ring-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{k.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{k.key}</p>
                    </div>
                    <Switch
                      checked={k.enabled}
                      onCheckedChange={(v) => void toggleKill(k.key, v)}
                    />
                  </li>
                ))}
                {!data.killSwitches?.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Defaults appear after first system save from API.
                  </p>
                ) : null}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan12, "h-full")}>
            <SaSection title="Feature flag % rollout" hint="F43">
              <ul className="space-y-4">
                {(data.featureFlags || []).map((f) => (
                  <li
                    key={f.key}
                    className="flex flex-col gap-4 rounded-2xl bg-muted px-4 py-4 ring-1 ring-border md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{f.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {f.key} · {f.enabled ? "on" : "off"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={f.rolloutPercent ?? 100}
                        className={cn(saInput, "h-10 w-24")}
                        id={`rollout-${f.key}`}
                      />
                      <SaSoftButton
                        tone="primary"
                        onClick={() => {
                          const el = document.getElementById(
                            `rollout-${f.key}`,
                          ) as HTMLInputElement | null;
                          void setRollout(f.key, Number(el?.value || 100));
                        }}
                      >
                        Apply %
                      </SaSoftButton>
                    </div>
                  </li>
                ))}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan5, "h-full")}>
            <SaSection title="Staff changelog" hint="F49">
              <div className="space-y-4">
                <input
                  value={changelogVersion}
                  onChange={(e) => setChangelogVersion(e.target.value)}
                  placeholder="Version e.g. 2.4.0"
                  className={saInput}
                />
                <input
                  value={changelogTitle}
                  onChange={(e) => setChangelogTitle(e.target.value)}
                  placeholder="Title"
                  className={saInput}
                />
                <Textarea
                  value={changelogBody}
                  onChange={(e) => setChangelogBody(e.target.value)}
                  placeholder="What changed…"
                  className="min-h-[88px] rounded-2xl border-border bg-muted"
                />
                <button
                  type="button"
                  className={saPrimaryBtn}
                  onClick={() => void publishChangelog()}
                >
                  Publish entry
                </button>
                <ul className="max-h-44 space-y-3 overflow-y-auto border-t border-slate-100 pt-3">
                  {(data.staffChangelog || []).map((c, i) => (
                    <li key={`${c.version}-${i}`} className="text-sm text-foreground">
                      <span className="font-black text-[#c147e9]">{c.version}</span>{" "}
                      — {c.title}
                    </li>
                  ))}
                </ul>
              </div>
            </SaSection>
          </div>

          <div className={cn(saSpan7, "h-full")}>
            <SaSection title="Report presets" hint="F50">
              <div className="flex flex-wrap gap-2">
                {(data.reportPresets || [
                  { key: "census", label: "Census" },
                  { key: "finance_mtd", label: "Finance MTD" },
                  { key: "live_now", label: "Live now" },
                  { key: "risk_board", label: "Risk board" },
                ]).map((p) => (
                  <SaSoftButton
                    key={p.key}
                    tone="primary"
                    onClick={() => void runReport(p.key)}
                  >
                    {p.label}
                  </SaSoftButton>
                ))}
              </div>
              {reportOut ? (
                <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-zinc-950 p-4 text-[11px] text-emerald-300 ring-1 ring-border">
                  {reportOut}
                </pre>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  Run a preset to preview JSON output here.
                </p>
              )}
            </SaSection>
          </div>

          <div className={cn(saSpan12, "h-full")}>
            <SaSection title="50-feature catalog" hint="Reference map">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {SUPER_ADMIN_FEATURE_CATALOG.map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      saCard,
                      "p-4 shadow-none ring-1 ring-border",
                    )}
                  >
                    <p className="text-[10px] font-bold text-[#c147e9]">{f.id}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{f.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{f.hub}</p>
                  </div>
                ))}
              </div>
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
}
