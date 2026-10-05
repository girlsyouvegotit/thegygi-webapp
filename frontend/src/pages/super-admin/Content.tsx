import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  saMainGrid,
  saPrimaryBtn,
  saSpan4,
  saSpan5,
  saSpan7,
  SaDarkPanel,
  SaEntityCard,
  SaRingCard,
  SaSoftButton,
  StatPill,
} from "@/lib/superAdminStyles";
import { SaHubShell, SaSection, useSaHub } from "@/components/super-admin/SaHub";
import { cn } from "@/lib/utils";

type ContentHub = {
  recordingStorage: {
    total: number;
    failedCount: number;
    byStatus: Array<{ status?: string; count: number }>;
  };
  failedRecordings: Array<{
    _id: string;
    title?: string;
    processingStatus?: string;
    createdAt?: string;
  }>;
  recentMessages: Array<{
    _id: string;
    content: string;
    deletedAt?: string;
    createdAt?: string;
    user?: { name?: string; email?: string };
  }>;
};

export default function ContentPage() {
  const { data, loading, error, reload } = useSaHub<ContentHub>(
    "/super-admin/content",
    "Failed to load content hub",
  );

  const purgeFailed = async () => {
    try {
      const { data: res } = await api.post(
        "/super-admin/content/recordings/purge-failed",
      );
      toast.success(`Purged ${res.data?.deleted || 0} failed recordings`);
      void reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Purge failed");
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await api.post(`/super-admin/content/messages/${id}/delete`);
      toast.success("Message hidden");
      void reload();
    } catch {
      toast.error("Could not delete message");
    }
  };

  const total = data?.recordingStorage.total ?? 0;
  const failed = data?.recordingStorage.failedCount ?? 0;
  const failPct = total > 0 ? (failed / total) * 100 : 0;

  return (
    <SaHubShell
      title="Content & storage"
      subtitle="Recording health and community moderation (F19–F22)."
      loading={loading && !data}
      error={error}
      onRetry={reload}
      actions={
        <button
          type="button"
          className={cn(
            saPrimaryBtn,
            "bg-rose-600 shadow-rose-500/30 hover:bg-rose-700",
          )}
          onClick={() => void purgeFailed()}
        >
          Purge failed recordings
        </button>
      }
    >
      {data ? (
        <div className={saMainGrid}>
          <div className={cn(saSpan4, "h-full")}>
            <SaDarkPanel
              title="Storage health"
              rows={[
                {
                  label: "Total recordings",
                  value: total.toLocaleString(),
                  color: "#c147e9",
                },
                {
                  label: "Failed count",
                  value: failed,
                  color: "#f43f5e",
                },
                {
                  label: "Moderation queue",
                  value: data.recentMessages?.length || 0,
                  color: "#5B5FEF",
                },
                {
                  label: "Failed list",
                  value: data.failedRecordings?.length || 0,
                  color: "#FF9F43",
                },
              ]}
            />
          </div>

          <div className={cn(saSpan4, "grid h-full gap-4")}>
            <SaRingCard
              title="Failure rate"
              subtitle="Failed vs total storage"
              percent={failPct}
              tone={failPct > 10 ? "orange" : "green"}
            />
          </div>

          <div className={cn(saSpan4, "grid h-full gap-4 sm:grid-cols-2")}>
            {(data.recordingStorage.byStatus || []).map((s) => (
              <StatPill
                key={String(s.status)}
                label={String(s.status || "unknown")}
                value={s.count}
              />
            ))}
            {!data.recordingStorage.byStatus?.length ? (
              <>
                <StatPill label="Total recordings" value={total} />
                <StatPill label="Failed" value={failed} />
              </>
            ) : null}
          </div>

          <div className={cn(saSpan5, "h-full")}>
            <SaSection title="Failed recordings" hint="F19 / F20">
              <ul className="max-h-[480px] space-y-3 overflow-y-auto">
                {(data.failedRecordings || []).map((r) => (
                  <SaEntityCard
                    key={r._id}
                    title={r.title || r._id}
                    tags={[
                      {
                        label: r.processingStatus || "failed",
                        tone: "bg-rose-50 text-rose-700",
                      },
                    ]}
                  />
                ))}
                {!data.failedRecordings?.length ? (
                  <div className="rounded-2xl bg-muted py-12 text-center text-sm text-muted-foreground">
                    No failures in queue
                  </div>
                ) : null}
              </ul>
            </SaSection>
          </div>

          <div className={cn(saSpan7, "h-full")}>
            <SaSection title="Community moderation feed" hint="F21 / F22">
              <ul className="max-h-[480px] space-y-3 overflow-y-auto">
                {(data.recentMessages || []).map((m) => (
                  <SaEntityCard
                    key={m._id}
                    title={m.user?.name || "Unknown"}
                    tags={
                      m.deletedAt
                        ? [{ label: "hidden", tone: "bg-rose-50 text-rose-600" }]
                        : [{ label: "visible", tone: "bg-emerald-50 text-emerald-700" }]
                    }
                    meta={m.user?.email}
                    actions={
                      !m.deletedAt ? (
                        <SaSoftButton
                          tone="warn"
                          onClick={() => void deleteMessage(m._id)}
                        >
                          Hide message
                        </SaSoftButton>
                      ) : undefined
                    }
                  >
                    <p className="line-clamp-3 text-sm text-muted-foreground">{m.content}</p>
                  </SaEntityCard>
                ))}
                {!data.recentMessages?.length ? (
                  <div className="rounded-2xl bg-muted py-12 text-center text-sm text-muted-foreground">
                    Feed is quiet
                  </div>
                ) : null}
              </ul>
            </SaSection>
          </div>
        </div>
      ) : null}
    </SaHubShell>
  );
}
