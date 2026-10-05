import { useState } from "react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  saInput,
  saMainGrid,
  saSpan4,
  saSpan8,
  SaDarkPanel,
  SaEntityCard,
  SaRingCard,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";

type Ticket = {
  _id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  requesterName?: string;
  requesterEmail?: string;
  slaDueAt?: string;
  createdAt?: string;
};

type SupportHub = {
  tickets: Ticket[];
  openCount: number;
  slaBreachedCount?: number;
  slaBreached?: number;
};

function isSlaBreached(t: Ticket): boolean {
  if (!t.slaDueAt) return false;
  try {
    return isPast(parseISO(t.slaDueAt)) && t.status !== "resolved" && t.status !== "closed";
  } catch {
    return false;
  }
}

export default function SupportPage() {
  const { data, loading, error, reload } = useSaHub<SupportHub>(
    "/super-admin/support",
    "Failed to load support hub",
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("medium");

  const createTicket = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body required");
      return;
    }
    try {
      await api.post("/super-admin/support/tickets", {
        subject,
        body,
        priority,
      });
      toast.success("Ticket created");
      setSubject("");
      setBody("");
      void reload();
    } catch {
      toast.error("Could not create ticket");
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/super-admin/support/tickets/${id}`, { status });
      toast.success(`Marked ${status}`);
      void reload();
    } catch {
      toast.error("Update failed");
    }
  };

  const slaBreached = data?.slaBreachedCount ?? data?.slaBreached ?? 0;
  const openCount = data?.openCount || 0;
  const tickets = data?.tickets || [];
  const breachedOnPage = tickets.filter(isSlaBreached).length;

  return (
    <SaHubShell
      title="Support inbox"
      subtitle="Lightweight ticket queue with SLA breach highlights (F48)."
      loading={loading && !data}
      error={error}
      onRetry={reload}
    >
      {data ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Queue snapshot"
              rows={[
                { label: "Open tickets", value: openCount, color: "#5B5FEF" },
                { label: "SLA breached", value: slaBreached, color: "#f43f5e" },
                { label: "Shown in feed", value: tickets.length, color: "#c147e9" },
                { label: "Breaches (visible)", value: breachedOnPage, color: "#FF9F43" },
              ]}
            />
          </div>

          <div className={cn(saSpan4, "h-full grid gap-5")}>
            <SaRingCard
              title="SLA health"
              subtitle="Breached vs open"
              percent={
                openCount > 0
                  ? Math.max(0, 100 - (slaBreached / openCount) * 100)
                  : 100
              }
              tone={slaBreached > 0 ? "orange" : "green"}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <StatPill label="Open" value={openCount} />
              <StatPill
                label="SLA breached"
                value={slaBreached}
                valueClassName="text-rose-600"
              />
            </div>
          </div>

          <div className={cn(saSpan4, "h-full")}>
            <SaSection title="New ticket">
              <div className="space-y-4">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className={saInput}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Details…"
                  className="min-h-28 rounded-2xl border-border bg-muted"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={saInput}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <SaSoftButton tone="primary" onClick={() => void createTicket()}>
                  Create ticket
                </SaSoftButton>
              </div>
            </SaSection>
          </div>

          <div className={cn(saSpan8, "h-full xl:col-span-12")}>
            <SaSection title="Queue" hint="SLA breaches highlighted in rose">
              <div className="grid max-h-[34rem] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
                {tickets.map((t) => {
                  const breached = isSlaBreached(t);
                  return (
                    <div
                      key={t._id}
                      className={cn(
                        breached && "rounded-[24px] p-0.5 ring-2 ring-rose-400 ring-offset-2",
                      )}
                    >
                      <SaEntityCard
                        title={t.subject}
                        meta={
                          [
                            t.requesterName || t.requesterEmail,
                            t.createdAt
                              ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })
                              : null,
                            t.slaDueAt && breached ? "SLA breached" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || undefined
                        }
                        tags={[
                          { label: t.status, tone: "bg-muted text-muted-foreground" },
                          {
                            label: t.priority,
                            tone:
                              t.priority === "critical"
                                ? "bg-rose-50 text-rose-700"
                                : t.priority === "high"
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-primary/15 text-primary",
                          },
                          ...(breached
                            ? [{ label: "SLA breach", tone: "bg-rose-100 text-rose-800" }]
                            : []),
                        ]}
                      >
                        <p className="line-clamp-3 text-sm text-muted-foreground">{t.body}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {["open", "in_progress", "resolved", "closed"].map((s) => (
                            <SaSoftButton
                              key={s}
                              className="text-[10px]"
                              onClick={() => void setStatus(t._id, s)}
                            >
                              {s.replace("_", " ")}
                            </SaSoftButton>
                          ))}
                        </div>
                      </SaEntityCard>
                    </div>
                  );
                })}
                {!tickets.length ? (
                  <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    No tickets yet
                  </p>
                ) : null}
              </div>
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
}
