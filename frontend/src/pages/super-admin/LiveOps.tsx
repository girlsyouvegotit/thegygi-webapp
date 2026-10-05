import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  saMainGrid,
  saPrimaryBtn,
  saSpan4,
  saSpan8,

  SaDarkPanel,
  SaEntityCard,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";
import { cn } from "@/lib/utils";

type LiveOpsHub = {
  rooms: Array<{ _id: string; status?: string; type?: string; updatedAt?: string }>;
  classes: Array<{
    _id: string;
    title?: string;
    status?: string;
    scheduledDate?: string;
    tutor?: { name?: string };
    category?: { name?: string };
  }>;
  failedRecordings: Array<{ _id: string; processingError?: string; date?: string }>;
};

const LiveOpsPage = () => {
  const { data: live, loading, error, reload } = useSaHub<LiveOpsHub>(
    "/super-admin/live-ops",
    "Failed to load live ops",
    20000,
  );
  const [ending, setEnding] = useState<string | null>(null);

  const endRoom = async (id: string) => {
    setEnding(id);
    try {
      await api.post(`/super-admin/live-ops/rooms/${id}/end`);
      toast.success("Room force-ended");
      void reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to end room");
    } finally {
      setEnding(null);
    }
  };

  const endAllRooms = async () => {
    setEnding("all");
    try {
      const { data } = await api.post("/super-admin/live-ops/end-all");
      toast.success(`Ended ${data.data?.ended || 0} room(s)`);
      void reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to end all rooms");
    } finally {
      setEnding(null);
    }
  };

  const activeRooms =
    live?.rooms.filter((r) => r.status === "active").length ?? 0;
  const waitingRooms =
    live?.rooms.filter((r) => r.status !== "active").length ?? 0;

  return (
    <SaHubShell
      title="Live ops console"
      subtitle="Rooms, upcoming classes, and failed recordings — auto-refresh every 20s. Force-end all is F28."
      loading={loading && !live}
      error={error}
      onRetry={reload}
      actions={
        <button
          type="button"
          className={cn(
            saPrimaryBtn,
            "bg-rose-600 shadow-rose-500/30 hover:bg-rose-700",
          )}
          disabled={ending === "all"}
          onClick={() => void endAllRooms()}
        >
          {ending === "all" ? (
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          ) : null}
          Force-end all rooms
        </button>
      }
    >
      {live ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Live snapshot"
              rows={[
                { label: "Active rooms", value: activeRooms, color: "#f43f5e" },
                { label: "Waiting / idle", value: waitingRooms, color: "#FF9F43" },
                {
                  label: "Classes in window",
                  value: live.classes.length,
                  color: "#c147e9",
                },
                {
                  label: "Failed recordings",
                  value: live.failedRecordings.length,
                  color: "#5B5FEF",
                },
              ]}
            />
          </div>

          <div className={cn(saSpan8, "h-full grid gap-4 sm:grid-cols-3")}>
            <StatPill label="Total rooms" value={live.rooms.length} hint="Open now" />
            <StatPill
              label="Live classes"
              value={live.classes.filter((c) => c.status === "live").length}
              hint="In window"
            />
            <StatPill
              label="Poll interval"
              value="20s"
              hint="Background refresh"
            />
          </div>

          <div className={cn(saSpan4, "h-full")}>
            <SaSection title="Active / waiting rooms">
              <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
                {(live.rooms || []).map((r) => (
                  <SaEntityCard
                    key={r._id}
                    title={`${r.type || "room"} · ${r.status}`}
                    tags={[
                      {
                        label: r.status === "active" ? "live" : r.status || "idle",
                        tone:
                          r.status === "active"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-muted text-muted-foreground",
                      },
                    ]}
                    meta={
                      r.updatedAt
                        ? format(new Date(r.updatedAt), "MMM d · h:mm a")
                        : r._id.slice(-6)
                    }
                    actions={
                      r.status === "active" ? (
                        <SaSoftButton
                          tone="danger"
                          disabled={ending === r._id}
                          onClick={() => void endRoom(r._id)}
                        >
                          {ending === r._id ? "Ending…" : "Force end"}
                        </SaSoftButton>
                      ) : undefined
                    }
                  />
                ))}
                {!live.rooms?.length ? (
                  <div className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">
                    No rooms open
                  </div>
                ) : null}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan4, "h-full")}>
            <SaSection title="Classes window">
              <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
                {(live.classes || []).map((c) => (
                  <SaEntityCard
                    key={c._id}
                    title={c.title || "Untitled class"}
                    tags={[
                      {
                        label: c.status || "scheduled",
                        tone: "bg-primary/15 text-primary",
                      },
                      {
                        label: c.category?.name || "Category",
                        tone: "bg-muted text-muted-foreground",
                      },
                    ]}
                    meta={[
                      c.tutor?.name,
                      c.scheduledDate
                        ? format(new Date(c.scheduledDate), "MMM d h:mm a")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
                {!live.classes?.length ? (
                  <div className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">
                    Quiet window
                  </div>
                ) : null}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan4, "h-full")}>
            <SaSection title="Failed recordings">
              <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
                {(live.failedRecordings || []).map((r) => (
                  <SaEntityCard
                    key={r._id}
                    title={`Recording …${r._id.slice(-8)}`}
                    tags={[
                      {
                        label: "failed",
                        tone: "bg-rose-50 text-rose-700",
                      },
                    ]}
                    meta={r.processingError || "Processing failed"}
                  />
                ))}
                {!live.failedRecordings?.length ? (
                  <div className="rounded-2xl bg-muted py-10 text-center text-sm text-muted-foreground">
                    No failures
                  </div>
                ) : null}
              </ul>
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
};

export default LiveOpsPage;
