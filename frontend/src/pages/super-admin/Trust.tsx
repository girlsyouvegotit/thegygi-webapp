import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  saInput,
  saMainGrid,
  saSpan4,
  saSpan6,
  SaDarkPanel,
  SaEntityCard,
  SaRingCard,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";

type TrustHub = {
  blocklists?: {
    ipBlocklist: string[];
    emailBlocklist: string[];
  };
  ipBlocklist?: string[];
  emailBlocklist?: string[];
  lockedUsers: Array<{
    _id: string;
    name: string;
    email: string;
    failedLoginAttempts?: number;
    lockedUntil?: string;
  }>;
  highFailedLogins?: Array<{
    _id: string;
    name: string;
    email: string;
    failedLoginAttempts: number;
  }>;
  highFailureUsers?: Array<{
    _id: string;
    name: string;
    email: string;
    failedLoginAttempts: number;
  }>;
};

export default function TrustPage() {
  const { data, loading, error, reload } = useSaHub<TrustHub>(
    "/super-admin/trust",
    "Failed to load trust hub",
  );
  const [ips, setIps] = useState("");
  const [emails, setEmails] = useState("");
  const [targetUserId, setTargetUserId] = useState("");

  const saveBlocklists = async () => {
    try {
      await api.put("/super-admin/system", {
        ipBlocklist: (ips || ipList.join("\n") || "")
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        emailBlocklist: (emails || emailList.join("\n") || "")
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success("Blocklists updated");
      void reload();
    } catch {
      toast.error("Failed to save blocklists");
    }
  };

  const runUserAction = async (
    path: string,
    success: string,
    payload?: object,
  ) => {
    if (!targetUserId.trim()) {
      toast.error("User ID required");
      return;
    }
    try {
      const { data: res } = await api.post(
        `/super-admin/people/${targetUserId.trim()}/${path}`,
        payload,
      );
      toast.success(success);
      if (res.data?.resetToken) {
        toast.message(`Reset token: ${res.data.resetToken}`);
      }
      if (path === "gdpr-export" && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gdpr-${targetUserId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      void reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const ipList = data?.blocklists?.ipBlocklist || data?.ipBlocklist || [];
  const emailList = data?.blocklists?.emailBlocklist || data?.emailBlocklist || [];
  const abuseBoard = data?.highFailedLogins || data?.highFailureUsers || [];
  const lockedCount = data?.lockedUsers?.length || 0;

  return (
    <SaHubShell
      title="Trust & safety"
      subtitle="Blocklists, abuse board, session revoke, GDPR tools (F08, F44–F47)."
      loading={loading && !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Trust posture"
              rows={[
                { label: "IP blocks", value: ipList.length, color: "#c147e9" },
                { label: "Email blocks", value: emailList.length, color: "#5B5FEF" },
                { label: "Locked accounts", value: lockedCount, color: "#f43f5e" },
                { label: "High failures", value: abuseBoard.length, color: "#FF9F43" },
              ]}
            />
          </div>

          <div className={cn(saSpan4, "h-full grid gap-5")}>
            <SaRingCard
              title="Blocklist coverage"
              subtitle="IPs + emails"
              percent={Math.min(100, (ipList.length + emailList.length) * 4)}
              tone="primary"
            />
            <SaRingCard
              title="Lock rate"
              subtitle="Accounts locked now"
              percent={Math.min(100, lockedCount * 12)}
              tone="orange"
            />
          </div>

          <div className={cn(saSpan4, "h-full grid gap-5 sm:grid-cols-2 xl:grid-cols-1")}>
            <StatPill label="IP blocks" value={ipList.length} hint="F44" />
            <StatPill label="Email blocks" value={emailList.length} hint="F44" />
            <StatPill label="Locked now" value={lockedCount} hint="F45" />
            <StatPill label="Abuse signals" value={abuseBoard.length} hint="F45" />
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="IP / email blocklist" hint="F44">
              <div className="space-y-4">
                <Textarea
                  defaultValue={ipList.join("\n")}
                  onChange={(e) => setIps(e.target.value)}
                  placeholder="One IP per line"
                  className="min-h-28 rounded-2xl border-border bg-muted font-mono text-xs"
                />
                <Textarea
                  defaultValue={emailList.join("\n")}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="One email per line"
                  className="min-h-28 rounded-2xl border-border bg-muted font-mono text-xs"
                />
                <SaSoftButton tone="primary" onClick={() => void saveBlocklists()}>
                  Save blocklists
                </SaSoftButton>
              </div>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Account safety actions" hint="F08 / F46 / F47">
              <div className="space-y-4">
                <input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Target user ID"
                  className={cn(saInput, "font-mono text-xs")}
                />
                <div className="flex flex-wrap gap-2">
                  <SaSoftButton tone="primary" onClick={() => void runUserAction("revoke-sessions", "Sessions revoked")}>
                    Revoke sessions
                  </SaSoftButton>
                  <SaSoftButton onClick={() => void runUserAction("gdpr-export", "Export ready")}>
                    GDPR export
                  </SaSoftButton>
                  <SaSoftButton tone="danger" onClick={() => void runUserAction("gdpr-anonymize", "User anonymized")}>
                    GDPR anonymize
                  </SaSoftButton>
                </div>
              </div>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Locked accounts" hint="F45 / F06">
              <div className="grid max-h-[22rem] gap-4 overflow-y-auto pr-1 md:grid-cols-1">
                {(data.lockedUsers || []).map((u) => (
                  <SaEntityCard
                    key={u._id}
                    title={u.name}
                    meta={u.email}
                    tags={[
                      { label: "Locked", tone: "bg-rose-50 text-rose-700" },
                      ...(u.failedLoginAttempts
                        ? [
                            {
                              label: `${u.failedLoginAttempts} fails`,
                              tone: "bg-amber-50 text-amber-800",
                            },
                          ]
                        : []),
                    ]}
                    actions={
                      <SaSoftButton
                        tone="success"
                        onClick={() =>
                          void api
                            .post(`/super-admin/people/${u._id}/unlock`)
                            .then(() => {
                              toast.success("Unlocked");
                              void reload();
                            })
                            .catch(() => toast.error("Unlock failed"))
                        }
                      >
                        Unlock
                      </SaSoftButton>
                    }
                  />
                ))}
                {!data.lockedUsers?.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No locked accounts</p>
                ) : null}
              </div>
            </SaSection>
          </div>

          <div className={cn(saSpan6, "h-full")}>
            <SaSection title="Failed-login abuse board" hint="F45">
              <div className="grid max-h-[22rem] gap-4 overflow-y-auto pr-1">
                {abuseBoard.map((u) => (
                  <SaEntityCard
                    key={u._id}
                    title={u.name}
                    meta={u.email}
                    tags={[
                      {
                        label: `${u.failedLoginAttempts} fails`,
                        tone: "bg-amber-50 text-amber-800",
                      },
                    ]}
                  />
                ))}
                {!abuseBoard.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No abuse signals</p>
                ) : null}
              </div>
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
}
