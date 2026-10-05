import { useState } from "react";
import { Megaphone, Radio } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  saInput,
  saMainGrid,
  saSpan6,
  saSpan12,
  SaDarkPanel,
  SaRingCard,
  saPrimaryBtn,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection } from "@/components/super-admin/SaHub";

const ROLES = ["student", "tutor", "mentor", "admin"] as const;

export default function CommsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [roles, setRoles] = useState<string[]>(["student"]);
  const [emergency, setEmergency] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const sendBlast = async () => {
    if (!title.trim() || !message.trim() || !roles.length) {
      toast.error("Title, message, and at least one role required");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/super-admin/comms/blast", {
        title,
        message,
        roles,
      });
      setLastCount(data.data?.sent || 0);
      toast.success(`Blast sent to ${data.data?.sent || 0} users`);
      setTitle("");
      setMessage("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Blast failed");
    } finally {
      setBusy(false);
    }
  };

  const sendEmergency = async () => {
    if (!emergency.trim()) {
      toast.error("Emergency message required");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/super-admin/comms/emergency", {
        message: emergency,
      });
      toast.success(
        `Emergency broadcast delivered (${data.data?.sent || 0}) + banner armed`,
      );
      setEmergency("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Emergency broadcast failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SaHubShell
      title="Communications"
      subtitle="Role-targeted blasts and emergency broadcasts (F27, F39–F40)."
      actions={
        lastCount ? (
          <StatPill label="Last blast recipients" value={lastCount} />
        ) : null
      }
    >
      <div className={saMainGrid}>
        <div className={cn(saSpan6, "h-full")}>
          <SaDarkPanel
            title="Campaign reach"
            rows={[
              { label: "Roles selected", value: roles.length, color: "#c147e9" },
              { label: "Last blast sent", value: lastCount, color: "#22c55e" },
              {
                label: "Audience tags",
                value: roles.join(", ") || "—",
                color: "#5B5FEF",
              },
            ]}
          />
        </div>

        <div className={cn(saSpan6, "grid h-full grid-cols-1 gap-5")}>
          <SaRingCard
            title="Blast readiness"
            subtitle="Roles + copy"
            percent={
              (title.trim() ? 40 : 0) +
              (message.trim() ? 40 : 0) +
              (roles.length ? 20 : 0)
            }
            tone="primary"
          />
          <SaRingCard
            title="Emergency armed"
            subtitle="Message length"
            percent={Math.min(100, emergency.trim().length)}
            tone="orange"
          />
        </div>

        <div className={cn(saSpan6, "h-full")}>
          <SaSection title="Notification campaign" hint="F39 / F40 — in-app announcement">
            <div className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                className={saInput}
              />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message body…"
                className="min-h-28 rounded-2xl border-border bg-muted"
              />
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold capitalize transition",
                      roles.includes(role)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={saPrimaryBtn}
                disabled={busy}
                onClick={() => void sendBlast()}
              >
                <Megaphone className="mr-2 h-4 w-4" />
                Send blast
              </button>
            </div>
          </SaSection>
        </div>

        <div className={cn(saSpan6, "h-full")}>
          <SaSection
            title="Emergency broadcast"
            hint="F27 — notifies everyone + enables critical banner"
          >
            <div className="space-y-4">
              <Textarea
                value={emergency}
                onChange={(e) => setEmergency(e.target.value)}
                placeholder="Urgent platform-wide message…"
                className="min-h-28 rounded-2xl border-rose-200 bg-rose-50/30"
              />
              <SaSoftButton tone="danger" disabled={busy} onClick={() => void sendEmergency()}>
                <Radio className="mr-1.5 h-3.5 w-3.5" />
                Send emergency broadcast
              </SaSoftButton>
            </div>
          </SaSection>
        </div>

        <div className={cn(saSpan12, "h-full")}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {ROLES.map((role) => (
              <StatPill
                key={role}
                label={role}
                value={roles.includes(role) ? "Included" : "Off"}
                valueClassName={
                  roles.includes(role) ? "text-primary" : "text-muted-foreground"
                }
              />
            ))}
          </div>
        </div>
      </div>
    </SaHubShell>
  );
}
